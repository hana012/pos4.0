# CloudPanel VPS Backup Guide

## Overview
This guide explains how to set up automated online backups for your POS Invoice System on a VPS using CloudPanel.

## Method 1: CloudPanel Built-in Remote Backups (Recommended)

### Step 1: Access CloudPanel Backup
1. Login to CloudPanel (usually `https://your-vps-ip:8443`)
2. Navigate to **Backups** → **Remote Backups**

### Step 2: Add Backup Provider
CloudPanel supports multiple cloud storage providers via Rclone:

**Supported Providers:**
- ✅ Amazon S3
- ✅ Wasabi
- ✅ DigitalOcean Spaces
- ✅ Dropbox
- ✅ Google Drive
- ✅ SFTP
- ✅ And many more via Rclone

### Step 3: Configure Remote Backup
1. Click **Add Backup Provider**
2. Select your storage service (e.g., Amazon S3, Google Drive, etc.)
3. Enter credentials:
   - **S3**: Access Key ID, Secret Access Key, Bucket Name, Region
   - **Google Drive**: Follow OAuth setup instructions
   - **SFTP**: Host, Username, Password, Port
   - **Dropbox**: Follow OAuth setup instructions
4. Configure backup settings:
   - **Excludes**: Files/directories to exclude (e.g., `node_modules`, `*.log`)
   - **Backup Frequency**: Daily/Weekly/Monthly
   - **Retention**: How many backups to keep
5. Click **Save**

### Step 4: Create Manual Backup
1. Go to **Backups** → **Remote Backups**
2. Select your configured provider
3. Click **Create Backup**
4. Wait for completion
5. Verify backup in your cloud storage

### Step 5: Schedule Automatic Backups
CloudPanel allows you to schedule automatic backups:
1. In backup provider settings, configure:
   - **Schedule**: Set frequency (daily recommended)
   - **Time**: Choose off-peak hours (e.g., 2:00 AM)
   - **Retention Policy**: Keep last 7-30 days
2. Enable **Auto Backup**
3. Save settings

## Method 2: Database Backups (Automatic)

### Automatic Database Backups
CloudPanel automatically backs up all databases **nightly at 4:15 AM**.

### Adjust Backup Schedule
1. **Access Server via SSH:**
   ```bash
   ssh root@your-vps-ip
   ```

2. **Switch to CloudPanel admin user:**
   ```bash
   sudo su clp-admin
   ```

3. **Edit cron jobs:**
   ```bash
   crontab -e
   ```

4. **Find database backup line** (usually contains `db:backup`)
   - Default: `15 4 * * *` (4:15 AM daily)
   - Change to your preferred time (e.g., `0 2 * * *` for 2:00 AM)

5. **Save and exit**

### Manual Database Backup

**Backup All Databases:**
```bash
sudo su clp-admin
clpctl db:backup --databases=all
```

**Backup Specific Database:**
```bash
clpctl db:backup --databases=your_database_name
```

**Backup Location:**
- Database backups are stored in: `/home/clp/db-backups/`
- Format: `database_name_YYYY-MM-DD_HH-MM-SS.sql.gz`

## Method 3: Website-Specific Backups

### Backup Individual Site
1. Go to **Sites** → Select your site
2. Click **Backups** tab
3. Click **Create Backup**
4. Choose backup type:
   - **Files Only**: Website files
   - **Files + Database**: Complete backup
5. Download or store remotely

### Restore from Backup

**Via File Manager (files < 2 GB):**
1. Download backup file (`backup.tar`) from cloud storage
2. Upload to site's `tmp` directory via CloudPanel File Manager
3. Right-click → **Extract**
4. Copy files to appropriate locations

**Via SSH (larger files):**
```bash
# Upload backup.tar to ~/tmp/ via SFTP first
cd ~/tmp/
tar xf backup.tar
# Copy files to your site directory
cp -r extracted_files/* /home/your-site/public/
```

## Method 4: Automated Script Backup (Advanced)

### Create Backup Script
Create `/root/backup-pos.sh`:

```bash
#!/bin/bash

# Configuration
SITE_DIR="/home/your-site/public"
BACKUP_DIR="/home/clp/backups/pos-system"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="pos_backup_${DATE}.tar.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
tar -czf $BACKUP_DIR/$BACKUP_NAME -C $(dirname $SITE_DIR) $(basename $SITE_DIR)

# Upload to CloudPanel remote backup (if configured)
# CloudPanel handles this automatically via Remote Backups

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "pos_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_NAME"
```

### Schedule with Cron
```bash
crontab -e
# Add daily backup at 2 AM
0 2 * * * /root/backup-pos.sh >> /var/log/pos-backup.log 2>&1
```

## Method 5: CloudPanel CLI Commands

### Using CloudPanel CLI
CloudPanel provides CLI commands for backups:

```bash
# Switch to CloudPanel admin
sudo su clp-admin

# List available commands
clpctl --help

# Backup specific site
clpctl site:backup --site=your-site-name

# Backup all sites
clpctl site:backup --all

# List backups
clpctl backup:list
```

## Backup Best Practices

### 1. Multiple Backup Locations
- ✅ Local backup (on VPS)
- ✅ Remote backup (cloud storage)
- ✅ Off-site backup (different provider)

### 2. Backup Frequency
- **Daily**: For active POS systems (recommended)
- **Weekly**: For less critical data
- **Before major updates**: Always backup before system changes

### 3. Retention Policy
- Keep **7-30 days** of daily backups
- Keep **monthly backups** for 6-12 months
- Keep **yearly backups** for compliance

### 4. Test Restores
- Test restore process **monthly**
- Verify backup integrity
- Document restore procedure

## Important Notes for Your POS System

### Current Limitation
Your POS system uses **localStorage** (browser storage), which means:
- CloudPanel backups only backup **files** (HTML, JS, CSS)
- **User data** is stored in each browser
- Each user needs to export their data using "Backup to File"

### Recommended Solution
To enable server-side data backup:
1. **Add PHP backend** (recommended for CloudPanel)
2. **Store data in MySQL database**
3. **CloudPanel will automatically backup database** (nightly at 4:15 AM)
4. **Include database in remote backups**

## Quick Setup Checklist

- [ ] Configure CloudPanel Remote Backup provider
- [ ] Test manual backup creation
- [ ] Schedule automatic backups
- [ ] Verify database backups are running (check `/home/clp/db-backups/`)
- [ ] Test restore process
- [ ] Document backup locations and credentials
- [ ] Set up backup monitoring/notifications

## Troubleshooting

### Remote Backup Fails
- Check Rclone configuration: `rclone config show`
- Verify cloud storage credentials
- Check network connectivity
- Review CloudPanel logs: `/var/log/cloudpanel/`

### Database Backup Fails
- Check disk space: `df -h`
- Verify MySQL is running: `systemctl status mysql`
- Check permissions: `ls -la /home/clp/db-backups/`
- Review cron logs: `grep CRON /var/log/syslog`

### Backup Not Appearing in Cloud Storage
- Verify Rclone is configured correctly
- Check backup provider settings in CloudPanel
- Test Rclone manually: `rclone ls your-provider:backup-path`
- Check CloudPanel backup logs

## Security Best Practices

1. **Encrypt Backups**: Enable encryption in backup settings
2. **Secure Credentials**: Store backup credentials securely
3. **Access Control**: Limit who can access backups
4. **Regular Audits**: Review backup logs regularly
5. **Off-site Storage**: Keep backups in different location

## Monitoring Backups

### Check Backup Status
1. **CloudPanel Dashboard**: Backups → View recent backups
2. **SSH**: Check backup directory
   ```bash
   ls -lah /home/clp/db-backups/
   ls -lah /home/clp/backups/
   ```
3. **Logs**: Review backup logs
   ```bash
   tail -f /var/log/cloudpanel/backup.log
   ```

### Backup Notifications
Set up email notifications (if available in CloudPanel) or use monitoring tools to alert on backup failures.

## CloudPanel vs CyberPanel Differences

| Feature | CloudPanel | CyberPanel |
|---------|-----------|------------|
| **Remote Backups** | ✅ Via Rclone (many providers) | ✅ Built-in FTP/S3 |
| **Database Backups** | ✅ Automatic (4:15 AM) | ✅ Manual/Scheduled |
| **Backup Interface** | ✅ Modern Web UI | ✅ Web UI |
| **CLI Support** | ✅ `clpctl` commands | ⚠️ Limited |
| **Ease of Use** | ✅ Very Easy | ✅ Easy |

## Next Steps

1. **Set up Remote Backup** in CloudPanel
2. **Verify database backups** are running
3. **Test restore process**
4. **Schedule regular backups**
5. **Consider migrating to PHP** for server-side data storage

