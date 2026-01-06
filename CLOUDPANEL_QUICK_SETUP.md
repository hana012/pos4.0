# Quick Setup: CloudPanel Backup for POS System

## 🚀 Fast Setup (5 minutes)

### Step 1: Configure Remote Backup in CloudPanel

1. **Login to CloudPanel**
   - Open: `https://your-vps-ip:8443`
   - Login with your credentials

2. **Navigate to Remote Backups**
   - Click **Backups** → **Remote Backups**
   - Click **Add Backup Provider**

3. **Choose Your Cloud Storage**
   
   **Option A: Amazon S3 (Recommended)**
   - Select **Amazon S3**
   - Enter:
     - Access Key ID
     - Secret Access Key
     - Bucket Name
     - Region (e.g., `us-east-1`)
   - Click **Save**

   **Option B: Google Drive**
   - Select **Google Drive**
   - Follow OAuth authentication
   - Grant permissions
   - Click **Save**

   **Option C: SFTP**
   - Select **SFTP**
   - Enter:
     - Host (e.g., `ftp.yourhost.com`)
     - Username
     - Password
     - Port (usually 22)
   - Click **Save**

4. **Configure Backup Settings**
   - **Excludes**: Add `node_modules,*.log,.git` (optional)
   - **Schedule**: Set to **Daily**
   - **Time**: Choose **2:00 AM** (off-peak)
   - **Retention**: **7 days** (or more)
   - Enable **Auto Backup**
   - Click **Save**

5. **Test Backup**
   - Click **Create Backup** on your provider
   - Wait for completion
   - Verify in your cloud storage

### Step 2: Verify Database Backups

CloudPanel automatically backs up databases at **4:15 AM daily**.

**Check if backups are running:**
```bash
# SSH to your server
ssh root@your-vps-ip

# Check backup directory
ls -lah /home/clp/db-backups/

# Check cron job
sudo su clp-admin
crontab -l | grep db:backup
```

**Change backup time (optional):**
```bash
sudo su clp-admin
crontab -e
# Find the line with db:backup and change time
# Example: Change 15 4 * * * to 0 2 * * * (for 2:00 AM)
```

### Step 3: Backup Individual Site

1. Go to **Sites** → Select your POS site
2. Click **Backups** tab
3. Click **Create Backup**
4. Choose:
   - **Files + Database** (if you have database)
   - **Files Only** (for static site)
5. Backup will be created and can be downloaded or stored remotely

## 📍 Finding Your Site Directory

Common CloudPanel paths:
- `/home/your-site-name/public/`
- `/home/your-site-name/public_html/`

To find your exact path:
1. In CloudPanel: **Sites** → Your site → **Settings**
2. Check **Document Root** path
3. Or SSH and run: `ls -la /home/`

## 🔐 Cloud Storage Options

### Option 1: Amazon S3 (Recommended)
- **Pros**: Reliable, fast, cheap storage
- **Cost**: ~$0.023 per GB/month
- **Setup**: Need AWS account + access keys

### Option 2: Google Drive
- **Pros**: Free (15GB), easy setup
- **Cons**: Limited storage on free tier
- **Setup**: OAuth authentication

### Option 3: Wasabi
- **Pros**: S3-compatible, cheaper than S3
- **Cost**: ~$0.0069 per GB/month
- **Setup**: Similar to S3

### Option 4: DigitalOcean Spaces
- **Pros**: Simple, S3-compatible
- **Cost**: $5/month for 250GB
- **Setup**: Similar to S3

### Option 5: SFTP
- **Pros**: Works with any hosting provider
- **Setup**: Need FTP credentials

## ✅ Verification Checklist

- [ ] Remote backup provider configured
- [ ] Test backup created successfully
- [ ] Backup visible in cloud storage
- [ ] Automatic backups scheduled
- [ ] Database backups verified (check `/home/clp/db-backups/`)
- [ ] Test restore process completed
- [ ] Backup notifications configured (if available)

## 🆘 Troubleshooting

### Remote Backup Not Working
1. **Check Rclone Configuration:**
   ```bash
   sudo su clp-admin
   rclone config show
   ```

2. **Test Rclone Manually:**
   ```bash
   rclone ls your-provider:backup-path
   ```

3. **Check CloudPanel Logs:**
   ```bash
   tail -f /var/log/cloudpanel/backup.log
   ```

### Database Backup Not Running
1. **Check MySQL Status:**
   ```bash
   systemctl status mysql
   ```

2. **Check Disk Space:**
   ```bash
   df -h
   ```

3. **Check Cron Job:**
   ```bash
   sudo su clp-admin
   crontab -l
   ```

4. **Manual Backup Test:**
   ```bash
   clpctl db:backup --databases=all
   ```

### Backup Fails with Error
1. **Check Permissions:**
   ```bash
   ls -la /home/clp/db-backups/
   ls -la /home/clp/backups/
   ```

2. **Check Logs:**
   ```bash
   tail -50 /var/log/cloudpanel/backup.log
   grep -i error /var/log/cloudpanel/backup.log
   ```

## 📊 Monitoring Backups

### Check Backup Status in CloudPanel
1. **Dashboard**: View recent backup activity
2. **Backups → Remote Backups**: See backup history
3. **Sites → Your Site → Backups**: Site-specific backups

### Check via SSH
```bash
# Database backups
ls -lah /home/clp/db-backups/

# Site backups (if configured)
ls -lah /home/clp/backups/

# Check backup logs
tail -f /var/log/cloudpanel/backup.log
```

## 🔄 Restore Process

### Restore from Remote Backup
1. **Download backup** from cloud storage
2. **Upload to site** via File Manager or SFTP
3. **Extract** backup file
4. **Restore files** to appropriate locations

### Restore Database
```bash
# List available backups
ls -lah /home/clp/db-backups/

# Restore specific database
sudo su clp-admin
clpctl db:restore --database=your_db --file=/home/clp/db-backups/backup_file.sql.gz
```

## 💡 Important Notes

### Current Limitation
Your POS system uses **localStorage** (browser storage):
- CloudPanel backups only backup **files** (HTML, JS, CSS)
- **User data** is stored in each browser
- Users should export data using "Backup to File" in the app

### Future Enhancement
To backup actual user data:
1. Add **PHP backend** (works great with CloudPanel)
2. Store data in **MySQL database**
3. CloudPanel will **automatically backup database** (nightly)
4. Database included in **remote backups**

## 🎯 CloudPanel Advantages

✅ **Modern Interface**: Clean, intuitive web UI
✅ **Automatic Database Backups**: Runs daily at 4:15 AM
✅ **Multiple Cloud Providers**: Via Rclone integration
✅ **CLI Support**: `clpctl` commands for automation
✅ **Easy Restore**: Simple restore process
✅ **Resource Efficient**: Lightweight, fast

## 📞 Getting Help

- **CloudPanel Docs**: https://www.cloudpanel.io/docs/
- **Community Forum**: Check CloudPanel community
- **Support**: Contact CloudPanel support if needed

