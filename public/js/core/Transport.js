/**
 * CORE: TRANSPORT
 * Gère l'horloge et la boucle de rendu.
 */
export class Transport {
    constructor(callbacks) {
        this.currentTime = 0;
        this.isPlaying = false;
        this.animationFrameId = null;
        this.lastFrameTime = 0;
        this.onTick = callbacks.onTick || (() => {});
        this.onStop = callbacks.onStop || (() => {});
    }

    formatTime(seconds) {
        const date = new Date(0);
        date.setMilliseconds(seconds * 1000);
        return date.toISOString().substr(11, 8) + '.' + (seconds % 1).toFixed(2).substring(2);
    }

    play() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.lastFrameTime = performance.now();
        this.loop();
    }

    pause() {
        this.isPlaying = false;
        cancelAnimationFrame(this.animationFrameId);
    }

    stop() {
        this.pause();
        this.setTime(0);
        this.onStop();
    }

    toggle() {
        this.isPlaying ? this.pause() : this.play();
    }

    loop() {
        if (!this.isPlaying) return;
        const now = performance.now();
        const deltaTime = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;
        this.currentTime += deltaTime;
        this.onTick(this.currentTime);
        this.animationFrameId = requestAnimationFrame(() => this.loop());
    }

    setTime(seconds) {
        this.currentTime = Math.max(0, seconds);
        this.lastFrameTime = performance.now();
        this.onTick(this.currentTime);
    }
}