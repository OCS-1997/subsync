# Quick Tools Widget Module - Implementation Guide

## Overview

The Quick Tools Widget module provides a convenient way for users to access domain diagnostic tools directly from the navigation bar. Users can enter a domain and instantly open predefined diagnostic tools (DNS, Whois, MX, SSL, etc.) using URL templates that inject the domain name.

Admins can manage tools, set role permissions, and configure which tools are available to which user roles.

## Features

1. **Quick Tools Widget** - Single input field in navigation bar to enter domain and access diagnostic tools
2. **Tool Management** - Admin interface to create, edit, delete, and configure tools
3. **Role-Based Access** - Control which tools are visible to different user roles
4. **URL Template System** - Support for `{{domain}}` placeholder in URLs
5. **Live Preview** - Preview tool URLs with test domains before saving

## Installation

### Step 1: Database Migrations

Run the migrations in order:

```bash
# 1. Create quick_tools table with seed data
mysql -u your_user -p your_database < server/migrations/20241204_quick_tools_schema.sql

# 2. Add Quick Tools permissions
mysql -u your_user -p your_database < server/migrations/20241204_add_quick_tools_permissions.sql
```

### Step 2: Verify Installation

After running migrations, verify the tables exist:

```sql
-- Check quick_tools table
SHOW TABLES LIKE 'quick_tools';

-- Check permissions
SELECT permission_key FROM permissions WHERE resource = 'quick_tools';

-- Check default tools
SELECT * FROM quick_tools;
```

## Database Schema

### quick_tools Table

```sql
CREATE TABLE quick_tools (
    tool_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    url_template VARCHAR(500) NOT NULL,
    icon VARCHAR(100) NOT NULL,
    roles_allowed JSON NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Fields:**
- `tool_id` - Primary key
- `name` - Display name of the tool
- `url_template` - URL template with `{{domain}}` placeholder
- `icon` - Font Awesome icon class (e.g., `fa-globe`, `fa-search`)
- `roles_allowed` - JSON array of allowed roles: `["admin", "manager", "sales", "support", "viewer"]`
- `is_active` - Whether the tool is active/enabled
- `sort_order` - Display order (lower numbers appear first)

## API Endpoints

All endpoints require authentication via JWT token.

### User Endpoints

- **GET `/api/quick-tools`** - List tools available to current user's role
  - Requires: `quick_tools.view` permission
  - Returns: Array of tools filtered by user's role

### Admin Endpoints

- **GET `/api/quick-tools/all`** - List all tools (admin only)
  - Requires: `quick_tools.manage` permission
  - Returns: Array of all tools

- **GET `/api/quick-tools/:id`** - Get tool by ID
  - Requires: `quick_tools.manage` permission
  - Returns: Single tool object

- **POST `/api/quick-tools`** - Create new tool
  - Requires: `quick_tools.manage` permission
  - Body: `{ name, url_template, icon, roles_allowed, is_active, sort_order }`
  - Returns: `{ message, tool_id }`

- **PUT `/api/quick-tools/:id`** - Update tool
  - Requires: `quick_tools.manage` permission
  - Body: `{ name, url_template, icon, roles_allowed, is_active, sort_order }`
  - Returns: `{ message }`

- **DELETE `/api/quick-tools/:id`** - Delete tool
  - Requires: `quick_tools.manage` permission
  - Returns: `{ message }`

- **POST `/api/quick-tools/preview`** - Preview URL with test domain
  - Requires: `quick_tools.manage` permission
  - Body: `{ url_template, test_domain }`
  - Returns: `{ preview_url }`

## Frontend Components

### QuickToolsWidget

Location: `src/features/QuickTools/components/QuickToolsWidget.jsx`

A popover widget that appears in the navigation bar. Users can:
- Enter a domain name
- See filtered list of available tools
- Click a tool to open it in a new tab with the domain injected

**Usage:**
- Automatically appears in NavBar for users with `quick_tools.view` permission
- Positioned near the calculator button

### QuickToolsAdmin

Location: `src/features/QuickTools/pages/QuickToolsAdmin.jsx`

Admin interface for managing tools. Features:
- List all tools with search
- Create new tools
- Edit existing tools
- Delete tools
- Toggle active/inactive status
- Configure role permissions
- Live URL preview

**Access:** Settings → Quick Tools (admin only)

### ToolCard

Location: `src/features/QuickTools/components/ToolCard.jsx`

Reusable card component for displaying tool information in the admin interface.

## Permissions

### Permission Keys

- `quick_tools.view` - View and use quick tools widget
- `quick_tools.manage` - Manage quick tools (admin only)

### Default Role Permissions

- **Admin** - Has both `view` and `manage` permissions
- **Manager, Sales, Support, Viewer** - Have `view` permission only

## Usage Examples

### Using the Widget

1. Click the search icon in the navigation bar (next to calculator)
2. Enter a domain name (e.g., `example.com`)
3. Click on any tool button to open it in a new tab
4. The domain will be automatically injected into the URL

### Adding a New Tool (Admin)

1. Navigate to Settings → Quick Tools
2. Click "Add Tool"
3. Fill in the form:
   - **Name**: Display name (e.g., "DNS Checker")
   - **URL Template**: Must include `{{domain}}` (e.g., `https://dnschecker.org/#A/{{domain}}`)
   - **Icon**: Font Awesome class (e.g., `fa-globe`)
   - **Roles Allowed**: Select which roles can see this tool
   - **Sort Order**: Display order (lower = first)
   - **Active**: Enable/disable the tool
4. Test the URL using the preview section
5. Click "Create"

### Example Tool Configurations

**DNS Checker:**
```json
{
  "name": "DNS Checker",
  "url_template": "https://dnschecker.org/#A/{{domain}}",
  "icon": "fa-globe",
  "roles_allowed": ["admin", "manager", "sales", "support", "viewer"],
  "is_active": true,
  "sort_order": 1
}
```

**SSL Labs:**
```json
{
  "name": "SSL Labs",
  "url_template": "https://www.ssllabs.com/ssltest/analyze.html?d={{domain}}",
  "icon": "fa-lock",
  "roles_allowed": ["admin", "manager", "support"],
  "is_active": true,
  "sort_order": 5
}
```

## Validation Rules

### URL Template Validation

- Must include `{{domain}}` placeholder
- Must result in a valid `http://` or `https://` URL when domain is injected
- Domain is automatically URL-encoded

### Roles Validation

- `roles_allowed` must be a non-empty array
- Only valid roles allowed: `admin`, `manager`, `sales`, `support`, `viewer`

### Domain Input Validation

- Basic domain format validation (regex)
- Empty domains are allowed (shows all tools)
- Invalid domains are rejected

## Security

1. **URL Scheme Validation** - Only `http://` and `https://` URLs are allowed
2. **Role-Based Access** - Users only see tools allowed for their role
3. **Admin-Only Management** - Only admins can create/edit/delete tools
4. **Input Sanitization** - Domain input is validated and URL-encoded

## Default Seed Data

The migration includes 5 default tools:

1. **DNS Checker** - `https://dnschecker.org/#A/{{domain}}`
2. **Google Toolbox** - `https://toolbox.googleapps.com/apps/dig/#A/{{domain}}`
3. **MXToolbox MX** - `https://mxtoolbox.com/SuperTool.aspx?action=mx:{{domain}}`
4. **Whois Lookup** - `https://who.is/whois/{{domain}}`
5. **SSL Labs** - `https://www.ssllabs.com/ssltest/analyze.html?d={{domain}}`

## Troubleshooting

### Widget Not Appearing

1. Check user has `quick_tools.view` permission
2. Verify tools exist and are active
3. Check user's role is in `roles_allowed` for at least one tool
4. Check browser console for errors

### Tools Not Loading

1. Verify API endpoint is accessible: `GET /api/quick-tools`
2. Check user's role in database
3. Verify tools have `is_active = 1`
4. Check `roles_allowed` JSON contains user's role

### URL Preview Not Working

1. Ensure URL template includes `{{domain}}`
2. Check URL results in valid http/https URL
3. Verify test domain is valid format
4. Check browser console for API errors

### Permission Errors

1. Verify permissions exist in database
2. Check role has permission assigned
3. Verify JWT token is valid
4. Check user's role hasn't changed

## Customization

### Adding Custom Icons

Use Font Awesome icon classes. Examples:
- `fa-globe` - Globe icon
- `fa-search` - Search icon
- `fa-lock` - Lock/SSL icon
- `fa-envelope` - Email/MX icon
- `fa-server` - Server icon

### Customizing Tool Order

Update `sort_order` field in database or admin UI. Lower numbers appear first.

### Restricting Tools to Specific Roles

Edit tool in admin UI and uncheck roles that shouldn't have access.

## Future Enhancements

Potential improvements:
- Support for multiple placeholders (e.g., `{{domain}}`, `{{ip}}`)
- Tool categories/grouping
- Custom tool icons (upload images)
- Tool usage analytics
- Keyboard shortcuts for quick access
- Recent domains history

## Support

For issues or questions:
1. Check this README
2. Review server logs for errors
3. Check browser console for frontend errors
4. Verify database migrations ran successfully

## Files Created

### Backend
- `server/migrations/20241204_quick_tools_schema.sql`
- `server/migrations/20241204_add_quick_tools_permissions.sql`
- `server/models/quickToolsModel.js`
- `server/services/quickToolsService.js`
- `server/controllers/quickToolsController.js`

### Frontend
- `src/features/QuickTools/components/QuickToolsWidget.jsx`
- `src/features/QuickTools/components/ToolCard.jsx`
- `src/features/QuickTools/pages/QuickToolsAdmin.jsx`

### Modified Files
- `server/constants/permissions.js` - Added Quick Tools permissions
- `server/routes/appRoutes.js` - Added API routes
- `src/constants/permissions.js` - Added frontend permissions
- `src/routes/Index.jsx` - Added admin route
- `src/components/layouts/Navigations/NavBar.jsx` - Added widget

