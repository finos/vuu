package org.finos.vuu.plugin.offheap;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.util.Arrays;

public class MemoryMappedBuffer implements AutoCloseable {

    private static final long SEGMENT_SIZE = 1L << 30; //1GB
    private final MappedByteBuffer[] segments;
    private final long totalCapacity;

    public MemoryMappedBuffer(String filePath, long capacity) throws IOException {
        this.totalCapacity = capacity;
        int numSegments = (int) ((capacity + SEGMENT_SIZE - 1) / SEGMENT_SIZE);
        this.segments = new MappedByteBuffer[numSegments];

        try (var raf = new RandomAccessFile(filePath, "rw");
             var channel = raf.getChannel()) {

            for (int i = 0; i < numSegments; i++) {
                long position = i * SEGMENT_SIZE;
                long size = Math.min(SEGMENT_SIZE, capacity - position);
                segments[i] = channel.map(FileChannel.MapMode.READ_WRITE, position, size);
            }
        }
    }

    public void put(long index, byte b) {
        int segmentIndex = (int) (index / SEGMENT_SIZE);
        int segmentOffset = (int) (index % SEGMENT_SIZE);
        segments[segmentIndex].put(segmentOffset, b);
    }

    public byte get(long index) {
        int segmentIndex = (int) (index / SEGMENT_SIZE);
        int segmentOffset = (int) (index % SEGMENT_SIZE);
        return segments[segmentIndex].get(segmentOffset);
    }

    public long capacity() {
        return totalCapacity;
    }

    @Override
    public void close() {
        Arrays.fill(segments, null);
    }
}
