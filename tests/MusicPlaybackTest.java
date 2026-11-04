package io.freemytv;

public final class MusicPlaybackTest {
    private static int assertions;
    private static void check(long actual, long expected, String reason) {
        assertions++;
        if (actual != expected) throw new AssertionError(reason + ": " + actual + " != " + expected);
    }
    public static void main(String[] args) {
        check(MusicPlayback.position(10000, 1000, 4000, 1, true, 60000), 13000, "playing advances");
        check(MusicPlayback.position(10000, 1000, 4000, 1, false, 60000), 10000, "paused stays put");
        check(MusicPlayback.position(10000, 1000, 4000, 2, true, 60000), 16000, "playback speed");
        check(MusicPlayback.position(59000, 1000, 4000, 1, true, 60000), 60000, "end of track clamps");
        check(MusicPlayback.position(-1, 1000, 4000, 1, true, 60000), 0, "unknown position stays unknown");
        check(MusicPlayback.position(10000, 0, 4000, 1, true, 60000), 10000, "missing timestamp does not advance");
        check(MusicPlayback.position(10000, 5000, 4000, 1, true, 60000), 10000, "future timestamp");
        check(MusicPlayback.position(10000, 1000, 4000, 1, true, 0), 13000, "live stream without duration");
        check(MusicPlayback.position(1000, 1000, 4000, -1, true, 60000), 0, "rewind clamps at zero");
        System.out.println("MusicPlayback: " + assertions + " assertions passed");
    }
}
