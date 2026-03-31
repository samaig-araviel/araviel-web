import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchProviderStatus, fetchStatusHistory } from '../../services/status';

export const fetchStatusThunk = createAsyncThunk('status/fetch', async (_, { rejectWithValue }) => {
  try {
    return await fetchProviderStatus();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

export const fetchStatusHistoryThunk = createAsyncThunk(
  'status/fetchHistory',
  async (params = {}, { rejectWithValue }) => {
    try {
      const result = await fetchStatusHistory(params);
      return { key: params.provider ?? 'all', ...result };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const statusSlice = createSlice({
  name: 'status',
  initialState: {
    providers: {},
    platform: {},
    overall: 'unknown',
    timestamp: null,
    history: {},
    loading: false,
    historyLoading: false,
    lastFetched: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStatusThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStatusThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.providers = action.payload.providers ?? {};
        state.platform = action.payload.platform ?? {};
        state.overall = action.payload.overall ?? 'unknown';
        state.timestamp = action.payload.timestamp;
        state.lastFetched = Date.now();
      })
      .addCase(fetchStatusThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch status';
      })
      .addCase(fetchStatusHistoryThunk.pending, (state) => {
        state.historyLoading = true;
      })
      .addCase(fetchStatusHistoryThunk.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.history[action.payload.key] = action.payload.data ?? [];
      })
      .addCase(fetchStatusHistoryThunk.rejected, (state) => {
        state.historyLoading = false;
      });
  },
});

export const selectProviders = (state) => state.status.providers;
export const selectPlatform = (state) => state.status.platform;
export const selectOverall = (state) => state.status.overall;
export const selectStatusTimestamp = (state) => state.status.timestamp;
export const selectStatusLoading = (state) => state.status.loading;
export const selectStatusHistory = (state) => state.status.history;
export const selectHistoryLoading = (state) => state.status.historyLoading;
export const selectStatusError = (state) => state.status.error;

export default statusSlice.reducer;
