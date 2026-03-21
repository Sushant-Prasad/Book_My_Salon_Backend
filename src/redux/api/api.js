import { getTokenFromStorage } from "../../utils/features";
import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react"

const server = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";


const api = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({ baseUrl: `${server}/api/v1/`, prepareHeaders: (headers) => {
        const token = getTokenFromStorage();
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
     }}),
    tagTypes: ["GetInsight", "AddPost", "postDetails", "AdminInfo"],

    endpoints: (builder) => ({
        // Shop-aware barbers query
        getBarbers: builder.query({
            query: () => ({
                url: `shop/all-barbers`,
                credentials: "include",
            }),
            providesTags: ["Barbers"]
        }),
        
        // Shop-aware shop details query
        getShopDetails: builder.query({
            query: (id) => ({
                url: `shop/details/${id}`,
                credentials: "include",
            }),
            providesTags: ["ShopDetails"]
        }),
        
        // Shop-aware shop details for current user
        getMyShopDetails: builder.query({
            query: () => ({
                url: `shop/my-details`,
                credentials: "include",
            }),
            providesTags: ["ShopDetails"]
        }),
        
        // Shop-aware bookings query
        getBookings: builder.query({
            query: ({ status, page = 1, limit = 10 }) => ({
                url: `booking/barber/all-bookings?status=${status || ''}&page=${page}&limit=${limit}`,
                credentials: "include",
            }),
            providesTags: ["Bookings"]
        }),
        
        // Shop-aware customer bookings
        getCustomerBookings: builder.query({
            query: () => ({
                url: `booking/customer/my-bookings`,
                credentials: "include",
            }),
            providesTags: ["CustomerBookings"]
        }),
        
        // Shop-aware spam list
        getSpamList: builder.query({
            query: ({ page = 1, limit = 10 }) => ({
                url: `shop/spam-list?page=${page}&limit=${limit}`,
                credentials: "include",
            }),
            providesTags: ["SpamList"]
        }),
        
        // Shop-aware revenue data
        getQuarterlyRevenue: builder.query({
            query: () => ({
                url: `revenue/quarterly`,
                credentials: "include",
            }),
            providesTags: ["Revenue"]
        }),
        
        // Shop-aware barber monthly revenue
        getBarberMonthlyRevenue: builder.query({
            query: () => ({
                url: `revenue/barber-monthly`,
                credentials: "include",
            }),
            providesTags: ["BarberRevenue"]
        }),
        
        // Shop-aware booked slots
        getBookedSlots: builder.query({
            query: () => ({
                url: `booking/customer/booked-timeslots`,
                credentials: "include",
            }),
            providesTags: ["BookedSlots"]
        }),

        getOurTeam: builder.query({
            query: () => ({
                url: `review/barber/ratings`,
                credentials: "include",
            }),
            providesTags: ["OurTeam"]
        }),
        
        // Shop-aware booked time slots (alias for getBookedSlots)
        getBookedTimeSlots: builder.query({
            query: () => ({
                url: `booking/customer/booked-timeslots`,
                credentials: "include",
            }),
            providesTags: ["BookedSlots"]
        }),
        
        // Shop-aware customer's own bookings
        getMyBookings: builder.query({
            query: ({ status, page = 1, limit = 10 } = {}) => ({
                url: `booking/customer/my-bookings?status=${status || ''}&page=${page}&limit=${limit}`,
                credentials: "include",
            }),
            providesTags: ["CustomerBookings"]
        }),
        
        // Shop-aware barber date bookings
        getBarberDateBookings: builder.query({
            query: ({ barberId, date, page = 1, limit = 10 }) => ({
                url: `booking/barber/date-bookings?barber_id=${barberId}&date=${date}&page=${page}&limit=${limit}`,
                credentials: "include",
            }),
            providesTags: ["BarberDateBookings"]
        }),
        
        // Mutations for shop-aware operations
        createBooking: builder.mutation({
            query: (data) => ({
                url: `booking/create`,
                method: "POST",
                credentials: "include",
                body: data,
            }),
            invalidatesTags: ["Bookings", "BookedSlots"]
        }),
        
        createOfflineBooking: builder.mutation({
            query: (data) => ({
                url: `booking/create-offline`,
                method: "PUT",
                credentials: "include",
                body: data,
            }),
            invalidatesTags: ["Bookings", "BookedSlots"]
        }),
        
        updateBooking: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `booking/update/${id}`,
                method: "PUT",
                credentials: "include",
                body: data,
            }),
            invalidatesTags: ["Bookings", "CustomerBookings"]
        }),
        
        updateBookingStatus: builder.mutation({
            query: ({ id, status }) => ({
                url: `booking/status/${id}`,
                method: "PATCH",
                credentials: "include",
                body: { status },
            }),
            invalidatesTags: ["Bookings", "CustomerBookings", "BarberDateBookings"]
        }),

        makeSlotAvailable: builder.mutation({
            query: ({ id, payment_status }) => ({
                url: `booking/slot-free/${id}`,
                method: "PATCH",
                credentials: "include",
                body: { payment_status },
            }),
            invalidatesTags: ["Bookings", "CustomerBookings"]
        }),
        
        cancelBooking: builder.mutation({
            query: ({ bookingId, payment_status }) => ({
                url: `booking/cancel/${bookingId}`,
                method: "PUT",
                credentials: "include",
                body: { payment_status }
            }),
            invalidatesTags: ["Bookings", "CustomerBookings", "BookedSlots"]
        }),
        
        addToSpamList: builder.mutation({
            query: (data) => ({
                url: `shop/spam-list/add`,
                method: "POST",
                credentials: "include",
                body: data,
            }),
            invalidatesTags: ["SpamList"]
        }),
        
        removeFromSpamList: builder.mutation({
            query: (customerId) => ({
                url: `shop/spam-list/remove/${customerId}`,
                method: "DELETE",
                credentials: "include",
            }),
            invalidatesTags: ["SpamList"]
        }),
        
        updateShopDetails: builder.mutation({
            query: (data) => ({
                url: `shop/create-update`,
                method: "PUT",
                credentials: "include",
                body: data,
            }),
            invalidatesTags: ["ShopDetails", "AdminInfo"]
        }),

        updateAdminShopDetails: builder.mutation({
            query: (data) => ({
                url: `shop/create-update`,
                method: "PUT",
                credentials: "include",
                body: data,
            }),
            invalidatesTags: ["ShopDetails", "AdminInfo"]
        }),

        updateAdminShopInfo: builder.mutation({
            query: (data) => ({
                url: `admin/set-info`,
                method: "PUT",
                credentials: "include",
                body: data,
            }),
            invalidatesTags: ["ShopDetails", "AdminInfo"]
        }),
        
        removeBarber: builder.mutation({
            query: (barberId) => ({
                url: `user/remove/${barberId}`,
                method: "DELETE",
                credentials: "include",
            }),
            invalidatesTags: ["Barbers"]
        }),
        
        // Admin info endpoint
        getAdminInfo: builder.query({
            query: () => ({
                url: `admin/info`,
                credentials: "include",
            }),
            providesTags: ["AdminInfo"]
        }),
        
        // Authentication endpoints
        login: builder.mutation({
            query: (credentials) => ({
                url: `user/login`,
                method: "POST",
                credentials: "include",
                body: credentials,
            }),
        }),
        
        signup: builder.mutation({
            query: (userData) => ({
                url: `user/signup`,
                method: "POST",
                credentials: "include",
                body: userData,
            }),
        }),
    }),

    
})

export default api;
export const { 
    // Queries
    useGetBarbersQuery,
    useGetShopDetailsQuery,
    useGetMyShopDetailsQuery,
    useGetBookingsQuery,
    useGetCustomerBookingsQuery,
    useGetSpamListQuery,
    useGetQuarterlyRevenueQuery,
    useGetBarberMonthlyRevenueQuery,
    useGetBookedSlotsQuery,
    useGetOurTeamQuery,
    useGetBookedTimeSlotsQuery,
    useGetMyBookingsQuery,
    useGetBarberDateBookingsQuery,
    useGetAdminInfoQuery,
    
    // Mutations
    useCreateBookingMutation,
    useCreateOfflineBookingMutation,
    useUpdateBookingMutation,
    useUpdateBookingStatusMutation,
    useCancelBookingMutation,
    useAddToSpamListMutation,
    useRemoveFromSpamListMutation,
    useUpdateShopDetailsMutation,
    useUpdateAdminShopDetailsMutation,
    useUpdateAdminShopInfoMutation,
    useRemoveBarberMutation,
    useLoginMutation,
    useSignupMutation,
    useMakeSlotAvailableMutation,
} = api;