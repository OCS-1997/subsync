import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axiosInstance';

// Async thunks
export const fetchContacts = createAsyncThunk(
    'contacts/fetchContacts',
    async ({ page = 1, limit = 20, search = '' }, { rejectWithValue }) => {
        try {
            const response = await api.get('/contacts', {
                params: { page, limit, search }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch contacts');
        }
    }
);

export const fetchContactById = createAsyncThunk(
    'contacts/fetchContactById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.get(`/contacts/${id}`);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch contact');
        }
    }
);

export const createContact = createAsyncThunk(
    'contacts/createContact',
    async (contactData, { rejectWithValue }) => {
        try {
            const response = await api.post('/contacts', contactData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to create contact');
        }
    }
);

export const updateContact = createAsyncThunk(
    'contacts/updateContact',
    async ({ id, contactData }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/contacts/${id}`, contactData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to update contact');
        }
    }
);

export const deleteContact = createAsyncThunk(
    'contacts/deleteContact',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/contacts/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to delete contact');
        }
    }
);

const contactsSlice = createSlice({
    name: 'contacts',
    initialState: {
        contacts: [],
        currentContact: null,
        loading: false,
        error: null,
        totalPages: 1,
        totalRecords: 0,
        currentPage: 1
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearCurrentContact: (state) => {
            state.currentContact = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch contacts
            .addCase(fetchContacts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchContacts.fulfilled, (state, action) => {
                state.loading = false;
                state.contacts = action.payload.contacts;
                state.totalPages = action.payload.totalPages;
                state.totalRecords = action.payload.totalRecords;
                state.currentPage = action.payload.currentPage;
            })
            .addCase(fetchContacts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch contact by ID
            .addCase(fetchContactById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchContactById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentContact = action.payload.contact;
            })
            .addCase(fetchContactById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create contact
            .addCase(createContact.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createContact.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(createContact.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Update contact
            .addCase(updateContact.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateContact.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(updateContact.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Delete contact
            .addCase(deleteContact.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteContact.fulfilled, (state, action) => {
                state.loading = false;
                state.contacts = state.contacts.filter(c => c.contact_id !== action.payload);
            })
            .addCase(deleteContact.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearError, clearCurrentContact } = contactsSlice.actions;
export default contactsSlice.reducer;
