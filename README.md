# dbriq.com

The public website for dbriq: what the tool does, accounts (create, sign in, reset password),
and the beta download for signed-in users.

- **Hosting:** GitHub Pages (free), on your own domain dbriq.com.
- **Accounts and the installer:** Supabase (free plan to start). Visitors sign up with email and
  password; the installer sits in a private storage bucket that only signed-in users can download from.
- **Email:** Supabase sends the account emails (confirm, reset password) through your Zoho Mail.

```
index.html           home page
account.html         sign in, create account, forgot / reset password
download.html        the beta download (signed-in users only)
privacy.html         privacy policy
terms.html           beta terms
404.html             page not found
assets/js/config.js  THE file you edit: Supabase keys and the current beta version
supabase/setup.sql   run once in Supabase
CNAME, .nojekyll, .well-known/security.txt   needed by GitHub Pages; keep them
```

Allow about an hour for the whole setup. DNS changes can take a few hours to reach everyone.

---

## 1. Supabase: accounts and the private download

1. Sign up at https://supabase.com and click **New project**. Name it `dbriq`, choose the region
   **South Asia (Mumbai)**, and save the database password somewhere safe.
2. Open **SQL Editor**, click **New query**, paste all of `supabase/setup.sql`, and click **Run**.
   This creates the private `beta` bucket, lets signed-in users download from it, and records downloads.
3. **Upload the installer.** Open **Storage > beta > Upload file** and upload the `dbriqSetup.exe`
   from your GitHub release. Rename it to match `file` in `assets/js/config.js`
   (`dbriqSetup-1.0.0.exe`), or change `file` to match the name you used.

   > **File size:** the free plan accepts files up to **50 MB**. If your installer is bigger, Supabase
   > shows an error on upload. Either upgrade to the Pro plan and raise the limit under
   > **Project Settings > Storage**, or ask me for the alternative setup.

4. **Website address.** Open **Authentication > URL Configuration**:
   - Site URL: `https://dbriq.com`
   - Redirect URLs, add: `https://dbriq.com/**`, `https://www.dbriq.com/**`
     and, for testing on your PC, `http://localhost:8000/**`
5. **Sign-in rules.** Open **Authentication > Sign In / Providers > Email**: keep **Confirm email** on,
   and set **Minimum password length** to `12` (the site asks for 12).
6. **Send email through Zoho (required).** Supabase's built-in email only delivers to your own team's
   addresses, so visitors would never get their confirmation email without this step.
   1. In Zoho Mail, create the mailbox or alias `notifications@dbriq.com`. If your Zoho account uses
      two-factor sign-in, create an **app-specific password** for it (Zoho Account > Security >
      App passwords).
   2. In Supabase, open **Authentication > Emails > SMTP Settings** and turn on **custom SMTP**:

      | Setting | Value |
      |---|---|
      | Host | `smtp.zoho.in` (if you sign in to Zoho at zoho.in; use `smtp.zoho.com` for zoho.com) |
      | Port | `465` |
      | Username | `notifications@dbriq.com` |
      | Password | the mailbox password or app-specific password |
      | Sender email | `notifications@dbriq.com` |
      | Sender name | `dbriq` |

   3. Optional but worth it: under **Authentication > Emails > Templates**, change the subjects to
      "Confirm your dbriq account" and "Reset your dbriq password".
7. **Keys.** Open **Project Settings > API** (or **API Keys**) and copy the **Project URL** and the
   **anon** (or **publishable**) key into `assets/js/config.js`. These are meant to be public; the rules
   from `setup.sql` decide what they can do. Never put the `service_role` or secret key in the site.

## 2. GitHub Pages: the website

Use a **new public repository** for the website. Keep your dbriq source code in its private repository.

1. On GitHub, create a repository named `dbriq-website` under `dbriqtool`, set to **Public**.
2. Upload the contents of this folder, so `index.html` is at the top level of the repository.
   Upload with GitHub Desktop or `git push`. The website upload skips files whose names start with a
   dot, which is what happened with `.github` before. Afterwards, check that `.nojekyll` and
   `.well-known/security.txt` are in the repository. If either is missing, create it with
   **Add file > Create new file** (for `.nojekyll`, leave the file empty).
3. In the repository, open **Settings > Pages**:
   - Source: **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
   - Custom domain: `dbriq.com`, then **Save**.
4. Recommended: protect the domain from takeover. Open your GitHub **profile picture > Settings > Pages >
   Add a domain**, enter `dbriq.com`, and add the TXT record GitHub shows you in step 3 below.

## 3. Zoho: point dbriq.com at GitHub Pages

Open the DNS manager for dbriq.com. In the Zoho Mail admin console it is under **Domains > dbriq.com >
DNS Manager**; if the domain was bought through Zoho Domains it is also at https://domains.zoho.com.

1. Delete any existing **A** record for `@` and **CNAME** record for `www` (for example a parking page).
   **Don't touch the MX, SPF (TXT) or DKIM records**: they make your Zoho email work.
2. Add these records:

   | Type | Host / Name | Value |
   |---|---|---|
   | A | `@` | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |
   | CNAME | `www` | `dbriqtool.github.io` |
   | TXT | (from GitHub, step 2.4) | (from GitHub, step 2.4) |

3. Wait until **Settings > Pages** in the repository says the DNS check succeeded (minutes to a few
   hours), then tick **Enforce HTTPS**.

## 4. Test it

- [ ] https://dbriq.com and https://www.dbriq.com open the home page with a padlock.
- [ ] Create an account with a personal email; the confirmation email arrives from notifications@dbriq.com
      (check spam the first time).
- [ ] The confirmation link opens the download page, and the download starts.
- [ ] Sign out, sign in again, use **Forgot your password?**, and set a new password.
- [ ] Open https://dbriq.com/download.html in a private window: it sends you to sign in.
- [ ] Run the downloaded installer on a Windows PC.

## Releasing a new beta version

1. Publish the release on GitHub as before (tag `v1.1.0`) and download `dbriqSetup.exe` from it.
2. In Supabase **Storage > beta**, upload it as `dbriqSetup-1.1.0.exe`. Keep the old file until the
   website is updated.
3. Optional: get its checksum in PowerShell with `Get-FileHash .\dbriqSetup-1.1.0.exe` (SHA-256).
4. Edit `assets/js/config.js`: `version`, `released`, `size`, `sha256`, `file` and `downloadName`.
   Commit. GitHub Pages updates the site in a minute or two.

## Who signed up and downloaded

In Supabase **SQL Editor**:

```sql
select * from public.beta_users order by signed_up desc;
```

It lists name, email, company, role, whether they want new-version emails, when they signed up,
whether they confirmed, and how many times they downloaded. **Authentication > Users** shows the
same people. To delete someone, delete the user there; their download records go with them.

## Before you announce it

- `privacy.html` and `terms.html` are written in plain language as a starting point. They are not
  legal advice; have them checked, particularly against India's Digital Personal Data Protection Act.
- Make sure the mailboxes on the site exist in Zoho: hello@, support@, security@ and notifications@
  (aliases of one mailbox are fine).

## Trying the site on your PC

From this folder, run `python -m http.server 8000` and open http://localhost:8000. Without Supabase
keys in `config.js` the pages work, and the account pages say that accounts aren't connected yet.
