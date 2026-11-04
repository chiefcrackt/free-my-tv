package io.freemytv;

/** Position math shared by the card and its plain-Java regression checks. */
final class MusicPlayback {
    private MusicPlayback() {}

    static long position(long position, long updated, long now, float speed, boolean playing, long duration) {
        if (position < 0) return 0;
        if (playing && updated > 0 && now > updated) position += (long) ((now - updated) * (double) speed);
        return duration > 0 ? Math.max(0, Math.min(duration, position)) : Math.max(0, position);
    }
}
