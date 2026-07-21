package com.knust.codequest.sessionservice.dto;

import java.time.Instant;
import java.util.List;

/**
 * Cursor-paginated page. Mirrors the frontend {@code CursorPage<T>} type 1:1.
 */
public class CursorPage<T> {

    private List<T> data;
    private String nextCursor;
    private boolean hasMore;

    public CursorPage() {}

    public CursorPage(List<T> data, String nextCursor, boolean hasMore) {
        this.data = data;
        this.nextCursor = nextCursor;
        this.hasMore = hasMore;
    }

    public List<T> getData() { return data; }
    public void setData(List<T> data) { this.data = data; }
    public String getNextCursor() { return nextCursor; }
    public void setNextCursor(String nextCursor) { this.nextCursor = nextCursor; }
    public boolean isHasMore() { return hasMore; }
    public void setHasMore(boolean hasMore) { this.hasMore = hasMore; }
}
