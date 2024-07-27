function log(message: string, ...args: any[]) {
    console.log(`[${(new Date).toISOString()}] ${message}`, ...args)
}

export {
    log,
};
