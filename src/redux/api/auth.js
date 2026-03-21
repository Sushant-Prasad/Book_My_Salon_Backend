import { createSlice } from "@reduxjs/toolkit";
// import toast from "react-hot-toast";

const initialState = {
    user: null,
    loading: true,
    error: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setUser(state, action) {
            state.user = action.payload;
            state.loading = false;
        },
        setLoading(state, action) {
            state.loading = action.payload;
        },
        setError(state, action) {
            state.error = action.payload;
        },
        clearAuthState(state) {
            state.user = null;
            state.loading = false;
            state.error = null;
        },
    },
});


export const { setUser, setLoading, setError, clearAuthState } = authSlice.actions;
export default authSlice;
