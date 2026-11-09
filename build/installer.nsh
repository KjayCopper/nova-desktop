; Nova custom NSIS hooks.
;
; Keep the application off the system drive: the default install target is
; D:\Nova instead of %LOCALAPPDATA%\Programs\Nova on C:.
;
; preInit runs before electron-builder's multi-user initialisation, which is
; where $INSTDIR is derived. Seeding the per-user InstallLocation registry value
; makes that logic pick D:\Nova, and it also makes silent updates reuse the
; same folder. The assisted installer still shows the directory page, so the
; location can be changed if needed.

!include LogicLib.nsh

!macro preInit
  ${If} ${FileExists} "D:\NUL"
    StrCpy $INSTDIR "D:\Nova"
    WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "D:\Nova"
  ${EndIf}
!macroend
