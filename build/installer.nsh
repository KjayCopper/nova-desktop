; Nova custom NSIS hooks.

!include LogicLib.nsh

!macro preInit
  ${If} ${FileExists} "D:\NUL"
    StrCpy $INSTDIR "D:\Nova"
    WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "D:\Nova"
  ${EndIf}
!macroend

; Runs during both updates and real uninstalls. Clean up the legacy %APPDATA%\Nova
; folder used by builds before 0.1.3 (data now lives in <installDir>\data).
!macro customUnInstall
  RMDir /r "$APPDATA\Nova"
!macroend

; File removal: preserve data\ on update, wipe everything on real uninstall.
!macro customRemoveFiles
  ${If} ${isUpdated}
    ; Update: wipe the old app files but preserve the data\ folder.
    SetOutPath $TEMP
    Rename "$INSTDIR\data" "$PLUGINSDIR\data-backup"
    RMDir /r $INSTDIR
    CreateDirectory $INSTDIR
    Rename "$PLUGINSDIR\data-backup" "$INSTDIR\data"
  ${Else}
    ; Real uninstall: remove everything, including the data folder.
    SetOutPath $TEMP
    Delete "$INSTDIR\Uninstall*.exe"
    RMDir /r $INSTDIR
    RMDir $INSTDIR
  ${EndIf}
!macroend
