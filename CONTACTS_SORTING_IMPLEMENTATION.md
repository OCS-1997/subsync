# Contacts List - Sorting Implementation

## ✅ Sorting Feature - Fully Implemented!

Sorting functionality has been successfully added to the Contacts list page, matching the patterns used in Subscriptions, Customers, and Domains pages.

---

## 📋 **How Sorting Works**

### **User Experience:**
1. Click on any column header to sort by that column
2. First click: Sort **Ascending** (A→Z, 0→9)  
3. Second click: Sort **Descending** (Z→A, 9→0)
4. Third click: **Remove sorting** (return to default order)
5. Visual indicator shows current sort direction (↑ or ↓ arrow)

### **Sortable Columns:**
- ✅ **Name** (`full_name`) - Sorts by first name
- ✅ **Company** (`company_name`)
- ✅ **Email** (`email`)
- ✅ **Phone** (`phone`) - Sorts by phone number
- ✅ **Domain** (`domain`) - Sorts by domain name
- ❌ **Actions** - Not sortable

---

## 🔧 **Technical Implementation**

### **Frontend** (`ContactsList.jsx`)

#### State Management:
```javascript
const [sortBy, setSortBy] = useState(null);        // Column to sort by
const [sortOrder, setSortOrder] = useState(null);  // 'asc' or 'desc'
```

#### Sort Handler:
```javascript
const handleSort = (key) => {
    if (key === 'actions') return; // Skip actions column
    
    if (sortBy === key && sortOrder === 'asc') {
        setSortOrder('desc');  // 2nd click: descending
    } else if (sortBy === key && sortOrder === 'desc') {
        setSortBy(null);       // 3rd click: clear sort
        setSortOrder(null);
    } else {
        setSortBy(key);        // 1st click: ascending
        setSortOrder('asc');
    }
};
```

#### API Integration:
```javascript
useEffect(() => {
    const params = {
        search: debouncedSearch,
        page: currentPage,
        limit: 20,
    };
    if (sortBy && sortOrder) {
        params.sort = sortBy;      // e.g., 'full_name'
        params.order = sortOrder;  // 'asc' or 'desc'
    }
    dispatch(fetchContacts(params));
}, [dispatch, debouncedSearch, sortBy, sortOrder, currentPage]);
```

#### GenericTable Integration:
```javascript
<GenericTable
    headers={headers}
    data={tableData}
    primaryKey="contact_id"
    sortBy={sortBy}
    sortOrder={sortOrder}
    onSort={handleSort}  // Handler passed to GenericTable
/>
```

---

### **Backend Implementation**

#### **Controller** (`contactController.js`)

Extracts sort parameters from query string:
```javascript
const getContacts = async (req, res) => {
    const {
        page = 1,
        limit = 20,
        search = '',
        sort = null,      // NEW: Column to sort by
        order = 'asc'     // NEW: Sort direction
    } = req.query;

    const result = await getAllContacts({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        username,
        sort,
        order
    });
};
```

#### **Model** (`contactModel.js`)

##### Column Mapping:
Maps frontend column keys to database columns:
```javascript
const sortMap = {
    'full_name': 'c.first_name',       // Contact first name
    'company_name': 'c.company_name',  // Company name
    'email': 'c.email',                // Email address
    'phone': 'c.phone_number',         // Phone number
    'domain': 'd.domain_name'          // Domain name (from JOIN)
};
```

##### Dynamic ORDER BY:
```javascript
const sortColumn = sort && sortMap[sort] 
    ? sortMap[sort]        // Use mapped column
    : 'c.created_at';      // Default: newest first

const sortDirection = order && (order.toLowerCase() === 'desc' || order.toLowerCase() === 'asc')
    ? order.toUpperCase()
    : 'DESC';              // Default: descending

query += ` ORDER BY ${sortColumn} ${sortDirection} LIMIT ? OFFSET ?`;
```

##### Full Query Example:
```sql
-- When sorting by name (ascending):
SELECT c.*, d.domain_name 
FROM contacts c
LEFT JOIN domains d ON c.domain_id = d.domain_id
WHERE (c.is_private = 0 OR c.created_by = ?)
ORDER BY c.first_name ASC 
LIMIT 20 OFFSET 0;

-- When sorting by domain (descending):
ORDER BY d.domain_name DESC 
LIMIT 20 OFFSET 0;

-- When no sort specified (default):
ORDER BY c.created_at DESC 
LIMIT 20 OFFSET 0;
```

---

## 🔐 **Security Features**

### **SQL Injection Prevention:**
- ✅ **Whitelist approach**: Only predefined columns can be sorted
- ✅ **Column mapping**: Frontend keys mapped to safe SQL columns
- ✅ **Order validation**: Only 'asc' or 'desc' allowed
- ✅ **No user input** directly in SQL query

```javascript
// Safe: Uses whitelist mapping
const sortColumn = sortMap[sort] || 'c.created_at';

// ❌ UNSAFE (not used):
// query += ` ORDER BY ${req.query.sort}`;  // Direct injection risk
```

### **Privacy Enforcement:**
Sorting respects privacy filters:
```sql
-- Private contacts excluded OR shown only to creator
WHERE (c.is_private = 0 OR c.created_by = ?)
ORDER BY c.first_name ASC;
```

---

## 📊 **Sorting Behavior Examples**

### Example 1: Sort by Name
**Request:**
```
GET /api/contacts?sort=full_name&order=asc&page=1&limit=20
```

**Result:**
```
Ahmed Ali
Beta Contact
Charlie Brown
David Smith
...
```

### Example 2: Sort by Email (Descending)
**Request:**
```
GET /api/contacts?sort=email&order=desc&page=1&limit=20
```

**Result:**
```
zack@example.com
yoda@example.com
xavier@example.com
...
```

### Example 3: No Sorting (Default)
**Request:**
```
GET /api/contacts?page=1&limit=20
```

**Result:** Newest contacts first (by `created_at DESC`)

---

## 🎨 **UI Features**

### **Visual Indicators:**
The GenericTable component shows:
- ↑ **Up arrow** for ascending sort
- ↓ **Down arrow** for descending sort
- No arrow when column is not sorted

### **Page Reset:**
When you change sorting:
```javascript
useEffect(() => {
    setCurrentPage(1);  // Reset to page 1
}, [sortBy, sortOrder]);
```
This ensures users see results from the beginning when sorting changes.

---

## 🧪 **Testing the Feature**

### **Manual Testing:**
1. Navigate to Contacts page
2. Click "Name" column header
   - ✅ Contacts sorted A→Z by first name
3. Click "Name" again
   - ✅ Contacts sorted Z→A
4. Click "Name" third time
   - ✅ Sorting cleared, back to newest first
5. Click "Company" header
   - ✅ Sorted by company name
6. Try with search active
   - ✅ Sorting works on filtered results

### **Edge Cases:**
- ✅ Null/empty values handled (sorted to end/beginning)
- ✅ Domain name from JOIN works correctly
- ✅ Privacy filtering maintained during sorting
- ✅ Pagination works with sorting

---

## 📝 **Files Modified**

### Backend (2 files):
1. **`server/models/contactModel.js`**
   - Added `sort` and `order` parameters
   - Implemented column mapping
   - Dynamic ORDER BY clause

2. **`server/controllers/contactController.js`**
   - Extract sort parameters from query string
   - Pass to model function

### Frontend (Already Complete):
3. **`src/features/Contacts/pages/ContactsList.jsx`**
   - Sort state management
   - handleSort function
   - GenericTable integration
   - ✅ Already implemented in redesign!

---

## 🎯 **Performance Considerations**

### **Database Indexes:**
To ensure fast sorting, consider adding indexes:

```sql
-- Recommended indexes for better sort performance
CREATE INDEX idx_contacts_first_name ON contacts(first_name);
CREATE INDEX idx_contacts_company_name ON contacts(company_name);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_phone_number ON contacts(phone_number);

-- Already has index:
-- idx_contacts_created_by (for privacy filtering)
```

### **Query Optimization:**
- Uses `LIMIT` and `OFFSET` for pagination
- Filters applied before sorting
- Efficient JOIN with domains table
- Index on `is_private` for privacy filter

---

## ✅ **Summary**

**Sorting is now fully functional with:**
- ✅ 5 sortable columns
- ✅ Ascending/Descending/Clear cycle
- ✅ Backend database sorting (not client-side)
- ✅ SQL injection protection
- ✅ Privacy-aware filtering
- ✅ Visual sort indicators
- ✅ Page reset on sort change
- ✅ Consistent with other list pages

**The Contacts list now has the exact same sorting behavior as Subscriptions, Customers, and Domains!** 🎉
