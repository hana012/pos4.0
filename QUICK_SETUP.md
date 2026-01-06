# Quick Setup: CyberPanel Backup for POS System

## 🚀 Fast Setup (5 minutes)

### Step 1: Using CyberPanel GUI (Easiest)

1. **Login to CyberPanel**
   - Open: `https://your-vps-ip:8090`
   - Login with your credentials

2. **Navigate to Website Backups**
   - Click **Websites** → **List Websites**
   - Find your domain → Click **Backup/Restore**

3. **Create First Backup**
   - Click **Create Backup**
   - Wait for completion
   - Download backup to verify it works

4. **Schedule Automatic Backups**
   - Go to **Backup** → **Schedule Backup**
   - Set:
     - Frequency: **Daily**
     - Time: **2:00 AM** (or your preferred time)
     - Retention: **7 days** (or more)
   - Click **Create Schedule**

5. **Configure Remote Backup (Optional but Recommended)**
   - Go to **Backup** → **Remote Backup**
   - Click **Add Remote Backup**
   - Choose your storage type:
     - **FTP**: Most cloud storage providers support FTP
     - **AWS S3**: If you have AWS account
   - Enter credentials and test connection
   - Enable **Auto Sync**

### Step 2: Using Backup Script (Advanced)

1. **Upload the backup script to your VPS**
   ```bash
   # Via SSH, upload backup-pos.sh to /root/
   ```

2. **Edit the script configuration**
   ```bash
   nano /root/backup-pos.sh
   ```
   - Change `WEBSITE_DIR` to your actual website path
   - (Optional) Configure remote backup settings

3. **Make script executable**
   ```bash
   chmod +x /root/backup-pos.sh
   ```

4. **Test the script**
   ```bash
   /root/backup-pos.sh
   ```

5. **Schedule daily backups**
   ```bash
   crontab -e
   ```
   Add this line (runs daily at 2 AM):
   ```
   0 2 * * * /root/backup-pos.sh >> /var/log/pos-backup.log 2>&1
   ```

## 📍 Finding Your Website Directory

Common CyberPanel paths:
- `/home/yourdomain.com/public_html`
- `/home/cyberpanel/yourdomain.com/public_html`

To find your exact path:
1. In CyberPanel: **Websites** → **List Websites**
2. Your domain shows the path
3. Or SSH and run: `ls -la /home/`

## 🔐 Remote Backup Options

### Option 1: FTP (Easiest)
Most cloud storage providers offer FTP:
- **Dropbox**: Use Dropbox FTP
- **Google Drive**: Use third-party FTP services
- **OneDrive**: Use OneDrive FTP
- **Any web hosting**: Use their FTP

### Option 2: AWS S3
1. Create AWS account
2. Create S3 bucket
3. Get access keys
4. Install AWS CLI: `pip install awscli && aws configure`
5. Configure in backup script

### Option 3: Google Drive (via rclone)
1. Install rclone: `curl https://rclone.org/install.sh | sudo bash`
2. Configure: `rclone config`
3. Use in backup script

## ✅ Verification Checklist

- [ ] Created first manual backup
- [ ] Verified backup file downloads correctly
- [ ] Scheduled automatic backups
- [ ] Configured remote backup (recommended)
- [ ] Tested restore process
- [ ] Verified backups are being created (check after 24 hours)

## 🆘 Troubleshooting

### Backup fails in CyberPanel
- Check disk space: `df -h`
- Check CyberPanel logs: `/var/log/cyberpanel/backup.log`
- Ensure website directory exists

### Script backup fails
- Verify website directory path is correct
- Check permissions: `ls -la /home/backups/`
- Check script logs: `cat /var/log/pos-backup.log`

### Remote upload fails
- Verify network connectivity
- Check credentials are correct
- Test connection manually first

## 📊 Monitoring Backups

Check backup status:
- **CyberPanel**: Backup → Backup/Restore → View backups
- **Script**: `ls -la /home/backups/pos-system/`
- **Logs**: `tail -f /var/log/pos-backup.log`

## 🔄 Restore Process

### From CyberPanel:
1. Go to **Websites** → **List Websites**
2. Click **Backup/Restore** on your website
3. Select backup → Click **Restore**

### From Script Backup:
```bash
# Extract backup
tar -xzf /home/backups/pos-system/pos_backup_YYYYMMDD_HHMMSS.tar.gz -C /tmp/

# Copy files back
cp -r /tmp/public_html/* /home/yourdomain.com/public_html/
```

## 💡 Important Notes

**Current Limitation**: Your POS system uses localStorage (browser storage), so:
- Server backups only backup **files** (HTML, JS, CSS)
- **User data** is stored in each browser
- Users should export their data using "Backup to File" in the app

**Future Enhancement**: To backup actual data, you'd need to:
1. Add a backend API (PHP/Node.js)
2. Store data in a database
3. Include database in CyberPanel backups

