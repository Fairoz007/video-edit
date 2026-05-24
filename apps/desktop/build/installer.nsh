; NSIS hooks for DocuForge setup.exe — inform users about local Chatterbox download on first launch.

!macro customFinishPage
  !define MUI_FINISHPAGE_TITLE "Installation complete"
  !define MUI_FINISHPAGE_TEXT "DocuForge has been installed.$\r$\n$\r$\nOn first launch, the app will install required components: Python packages, Chatterbox voice models (~2–4 GB), Playwright for scraping, and FFmpeg for export. Install Python 3.11+ first (add to PATH), or skip setup to use cloud voices only.$\r$\n$\r$\nClick Finish to launch DocuForge."
!macroend
