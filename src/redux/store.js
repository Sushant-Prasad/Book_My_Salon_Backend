import {configureStore} from '@reduxjs/toolkit';
import bookingSlice from './api/api';
// import barberSlice from './api/barber.js';
import authSlice from './api/auth.js';

const initialState = {
    user: null,
    loading: true
}

const store = configureStore({
    reducer: {
        [bookingSlice.reducerPath]: bookingSlice.reducer,
        // [barberSlice.reducerPath]: barberSlice.reducer,
        [authSlice.reducerPath]: authSlice.reducer

    },
    middleware: (defaultMidddleware)=>[...defaultMidddleware(), bookingSlice.middleware]
});

export default store;