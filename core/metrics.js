import { promises as fs } from 'fs';
import path from 'path';

class MetricsManager {
    constructor() {
        this.filePath = path.join(process.cwd(), 'database', 'metrics.json');
        this.timeZone = 'America/Tegucigalpa';
        this.queue = [];
        this.isProcessing = false;
        this.saveScheduled = false;
        this.cache = null;

        this.init();
    }

    getHondurasDate(date = new Date()) {
        const options = { timeZone: this.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' };
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const [{ value: month }, , { value: day }, , { value: year }] = formatter.formatToParts(date);
        return `${year}-${month}-${day}`;
    }

    async init() {
        try {
            await fs.mkdir(path.dirname(this.filePath), { recursive: true });
            const data = await fs.readFile(this.filePath, 'utf-8').catch(() => null);
            if (data) {
                this.cache = JSON.parse(data);
            } else {
                this.cache = this.createInitialStructure();
            }
        } catch {
            this.cache = this.createInitialStructure();
        }
        this.cleanOldDays();
        this.scheduleDailyReset();
    }

    createInitialStructure() {
        return {
            days: {}
        };
    }

    getEmptyDayStructure() {
        return {
            totalMessages: 0,
            totalCommands: 0,
            activeUsers: [],
            activeChats: [],
            uptimeMs: 0,
            commandsUsage: {},
            hourlyActivity: Array(24).fill(0),
            errorsCount: 0,
            avgResponseTimeMs: 0,
            totalResponseTimeMs: 0
        };
    }

    cleanOldDays() {
        if (!this.cache || !this.cache.days) return;
        const today = new Date(new Date().toLocaleString('en-US', { timeZone: this.timeZone }));
        const validDates = [];

        for (let i = 0; i < 3; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            validDates.push(this.getHondurasDate(d));
        }

        Object.keys(this.cache.days).forEach(dateStr => {
            if (!validDates.includes(dateStr)) {
                delete this.cache.days[dateStr];
            }
        });
    }

    scheduleDailyReset() {
        const now = new Date();
        const hondurasTimeString = now.toLocaleString('en-US', { timeZone: this.timeZone });
        const hondurasDate = new Date(hondurasTimeString);

        const nextMidnight = new Date(hondurasDate);
        nextMidnight.setHours(24, 0, 0, 0);

        const msUntilMidnight = nextMidnight.getTime() - hondurasDate.getTime();

        setTimeout(() => {
            this.cleanOldDays();
            this.saveToDisk();
            this.scheduleDailyReset();
        }, msUntilMidnight);
    }

    enqueue(task) {
        this.queue.push(task);
        this.processQueue();
    }

    async processQueue() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        while (this.queue.length > 0) {
            const task = this.queue.shift();
            try {
                task();
            } catch {}
        }

        this.isProcessing = false;
        this.scheduleSave();
    }

    scheduleSave() {
        if (this.saveScheduled) return;
        this.saveScheduled = true;

        setTimeout(async () => {
            await this.saveToDisk();
            this.saveScheduled = false;
        }, 5000);
    }

    async saveToDisk() {
        try {
            if (!this.cache) return;
            const dataToSave = JSON.stringify(this.cache, (key, value) => {
                if (value instanceof Set) return Array.from(value);
                return value;
            }, 2);
            await fs.writeFile(this.filePath, dataToSave, 'utf-8');
        } catch {}
    }

    getTodayMetrics() {
        const today = this.getHondurasDate();
        if (!this.cache.days[today]) {
            this.cache.days[today] = this.getEmptyDayStructure();
        }
        return this.cache.days[today];
    }

    trackMessage(m) {
        this.enqueue(() => {
            const todayMetrics = this.getTodayMetrics();
            todayMetrics.totalMessages++;

            const currentHour = new Date(new Date().toLocaleString('en-US', { timeZone: this.timeZone })).getHours();
            todayMetrics.hourlyActivity[currentHour]++;

            if (m.sender && !todayMetrics.activeUsers.includes(m.sender)) {
                todayMetrics.activeUsers.push(m.sender);
            }

            if (m.chat && !todayMetrics.activeChats.includes(m.chat)) {
                todayMetrics.activeChats.push(m.chat);
            }
        });
    }

    trackCommand(commandName, sender, chat, success = true, executionTimeMs = 0) {
        this.enqueue(() => {
            const todayMetrics = this.getTodayMetrics();
            todayMetrics.totalCommands++;

            if (!todayMetrics.commandsUsage[commandName]) {
                todayMetrics.commandsUsage[commandName] = 0;
            }
            todayMetrics.commandsUsage[commandName]++;

            if (!success) {
                todayMetrics.errorsCount++;
            } else {
                todayMetrics.totalResponseTimeMs += executionTimeMs;
                const successfulCmds = todayMetrics.totalCommands - todayMetrics.errorsCount;
                todayMetrics.avgResponseTimeMs = Math.round(todayMetrics.totalResponseTimeMs / (successfulCmds || 1));
            }
        });
    }

    getStats() {
        return this.cache;
    }
}

export const metricsManager = new MetricsManager();
