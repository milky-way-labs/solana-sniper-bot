function log(message: string) {
    console.log(`[${(new Date).toISOString()}] ${message}`)
}

export {
    log,
};
