; École Manager - NSIS customisation
!macro customHeader
  !system "echo Installation professionnelle - École Manager"
!macroend

!macro customInstall
  CreateDirectory "$APPDATA\Ecole Manager\backups"
  CreateDirectory "$APPDATA\Ecole Manager\updates"
!macroend

!macro customUnInstall
  ; Les données utilisateur sont conservées par défaut pour éviter toute perte accidentelle.
  MessageBox MB_ICONQUESTION|MB_YESNO "Voulez-vous supprimer également les données locales, sauvegardes et réglages d'École Manager ?\n\nChoisissez Non pour les conserver." IDNO keepData
  RMDir /r "$APPDATA\Ecole Manager"
  keepData:
!macroend
