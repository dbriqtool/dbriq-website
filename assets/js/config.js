	/* dbriq.com settings. The only file you edit for a new beta release.

   supabaseUrl / supabaseAnonKey: Supabase > Project Settings > API ("Project URL" and the "anon public" key).
   The anon key is meant to be public; the database rules in supabase/setup.sql decide what it can do.

   beta: the installer you uploaded to the private "beta" bucket in Supabase Storage. For a new release,
   upload the new file, change these values, then commit and push. */
window.DBRIQ = {
  supabaseUrl: "https://xzrgdsfrwmfbhtkuinub.supabase.co",
  supabaseAnonKey: "sb_publishable_g-J7wkWbEPhyAk99R85BQA_rwZDkurp",

  beta: {
    version: "1.1.0 beta",
    released: "16 November 2026",
    size: "25 MB",                                  // for example "86 MB"; leave empty to hide
    sha256: "497773BCBFF5097AD154156BC166A44E2CA04A73A0B1147FD02911A2588662A3",                                // optional: PowerShell  Get-FileHash .\dbriqSetup.exe
    bucket: "beta",
    file: "dbriqSetup-1.1.0.zip",              // the file name inside the bucket
    downloadName: "dbriqSetup-1.1.0-beta.zip"  // the name it gets on the visitor's computer
  }
};
