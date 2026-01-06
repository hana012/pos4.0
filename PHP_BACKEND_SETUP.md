# PHP Backend Setup Guide - Enable Database Backups

## 🚀 Quick Setup (5 Steps)

### Step 1: Install PHP PostgreSQL Extension

**On Ubuntu/Debian (CloudPanel):**
```bash
sudo apt-get update
sudo apt-get install php-pgsql
sudo systemctl restart php-fpm
```

**Verify installation:**
```bash
php -m | grep pgsql
```

### Step 2: Create Database Table

**Connect to PostgreSQL:**
```bash
psql -U your_username -d your_database_name
```

**Run the schema:**
```sql
CREATE TABLE sonic_backups (
    id SERIAL PRIMARY KEY,
    backup_name VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version VARCHAR(50) DEFAULT '1.0',
    backup_data JSONB NOT NULL,
    data_size BIGINT,
    created_by VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sonic_backups_timestamp ON sonic_backups(timestamp DESC);
CREATE INDEX idx_sonic_backups_name ON sonic_backups(backup_name);
```

Or use the file:
```bash
psql -U your_username -d your_database_name -f database/schema.sql
```

### Step 3: Configure Database Credentials

Edit these 3 files and update `$db_config`:

**`api/backup.php`** (line ~18)
**`api/list-backups.php`** (line ~18)
**`api/status.php`** (line ~18)

```php
$db_config = [
    'host' => 'localhost',           // Your PostgreSQL host
    'port' => '5432',                // PostgreSQL port
    'dbname' => 'your_database_name', // Your database name
    'username' => 'your_db_username', // Your database username
    'password' => 'your_db_password'  // Your database password
];
```

### Step 4: Upload Files to VPS

Upload these files/folders to your VPS:
```
api/
  ├── backup.php
  ├── list-backups.php
  ├── status.php
  └── README.md

database/
  ├── schema.sql
  └── README.md
```

**Set correct permissions:**
```bash
chmod 644 api/*.php
chown www-data:www-data api/*.php  # Adjust user/group as needed
```

### Step 5: Test the Setup

1. **Test database connection:**
   ```
   https://your-domain.com/api/status.php
   ```
   Should show: `"connected": true`

2. **Test backup:**
   - Go to home page
   - Click "Backup Now"
   - Should show: "✅ Backup saved to database!"

3. **List backups:**
   ```
   https://your-domain.com/api/list-backups.php
   ```
   Should show list of backups

---

## ✅ Verification Checklist

- [ ] PHP PostgreSQL extension installed
- [ ] Database table created (`sonic_backups`)
- [ ] Database credentials configured in all 3 API files
- [ ] Files uploaded to VPS
- [ ] File permissions set correctly
- [ ] Status endpoint works (`/api/status.php`)
- [ ] Backup endpoint works (click "Backup Now")
- [ ] List backups endpoint works (`/api/list-backups.php`)

---

## 🔧 Troubleshooting

### Error: "Class 'PDO' not found"
```bash
sudo apt-get install php-pdo php-pgsql
sudo systemctl restart php-fpm
```

### Error: "Table does not exist"
- Run `database/schema.sql` to create table
- Check table exists: `\dt sonic_backups` in psql

### Error: "Connection refused"
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify credentials in API files
- Test connection: `psql -U username -d database -h localhost`

### Error: "Permission denied"
```sql
GRANT INSERT, SELECT ON sonic_backups TO your_db_username;
GRANT USAGE, SELECT ON SEQUENCE sonic_backups_id_seq TO your_db_username;
```

### Files return 404
- Check files are in correct directory
- Verify web server can access files
- Check file permissions: `ls -la api/`

### Files return 500 error
- Check PHP error logs: `tail -f /var/log/php-fpm/error.log`
- Verify database credentials
- Check PHP syntax: `php -l api/backup.php`

---

## 📊 What Happens Now

### Before (Static Site):
- ❌ Backups only in browser localStorage
- ❌ No server-side storage
- ❌ Data lost if browser cleared

### After (PHP Backend):
- ✅ Backups saved to PostgreSQL database
- ✅ Server-side storage
- ✅ Data persists across devices
- ✅ Can restore from database
- ✅ Backup history available

---

## 🎯 Next Steps

1. **Test backup functionality:**
   - Click "Backup Now" in home page
   - Verify backup saved to database

2. **Check VPS Status page:**
   - Go to "VPS & Database Status" (admin only)
   - Should show database connected

3. **View backup list:**
   - Visit `/api/list-backups.php`
   - See all saved backups

4. **Set up automatic cleanup:**
   - Create cron job to delete old backups
   - Keep last 30 days: `DELETE FROM sonic_backups WHERE timestamp < NOW() - INTERVAL '30 days';`

---

## 📝 Files Created

✅ **API Endpoints:**
- `api/backup.php` - Save backups to database
- `api/list-backups.php` - List all backups
- `api/status.php` - Check database connection

✅ **Database:**
- `database/schema.sql` - Create backup table
- `database/README.md` - Database documentation

✅ **Documentation:**
- `api/README.md` - API documentation
- `PHP_BACKEND_SETUP.md` - This setup guide

---

## 🎉 Success!

Once setup is complete:
- ✅ "Backup Now" saves to PostgreSQL database
- ✅ All system data backed up automatically
- ✅ Backups accessible from any device
- ✅ Full backup history available

Your POS system now has full database backup functionality! 🚀

