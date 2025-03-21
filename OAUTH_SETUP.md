# OAuth Consent Screen Setup Guide

## 1. Basic App Information

### Required Fields
- **App name**: Gmail AI Agent
- **User support email**: evenson.jre@gmail.com
- **Application home page**: [Your WebContainer URL]
- **Application privacy policy link**: Required for verification
- **Application terms of service link**: Required for verification
- **Authorized domain**: webcontainer-api.io
- **Developer contact information**: evenson.jre@gmail.com

### Logo Requirements
- Size: 120x120 pixels
- Format: PNG, JPG, or BMP
- Max size: 1MB
- Background: Light colored

## 2. Scopes Configuration

### Required Scopes
- `https://www.googleapis.com/auth/gmail.modify`
  - Purpose: Read and modify but not delete Gmail messages
  - Access level: Restricted
  - User data: Email messages and settings

## 3. Test Users
- Add your email address as a test user
- Status should be set to "Testing"
- No verification required for testing

## 4. Important Notes

### Security Considerations
- Keep the app in "Testing" mode during development
- Only add trusted test users
- Regularly review and revoke unused access
- Monitor API usage and quotas

### Best Practices
- Use clear and accurate app name
- Provide detailed app description
- Keep support email monitored
- Update privacy policy and terms of service
- Test thoroughly before verification

### Limitations
- Testing mode allows up to 100 users
- Scopes remain in testing until verification
- 7-day consent expiration for unverified apps