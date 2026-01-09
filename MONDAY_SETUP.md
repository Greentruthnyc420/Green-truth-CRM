## Monday.com Integration Setup

To enable the Monday.com integration, you will need to set the following configuration variable for your Firebase project:

```bash
firebase functions:config:set monday.signing_secret="YOUR_MONDAY.COM_SIGNING_SECRET"
```

Replace `YOUR_MONDAY.COM_SIGNING_SECRET` with the signing secret provided by Monday.com when you create your webhook.
