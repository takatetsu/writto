; インストール時の自動セクション（常に実行）
Section -ShellAssoc
  ; Backup the previously associated file class
  ReadRegStr $R0 HKCR ".md" ""
  WriteRegStr HKCR ".md" "Writto.MarkdownFile_backup" "$R0"

  ; Associate .md with Writto.MarkdownFile
  WriteRegStr HKCR ".md" "" "Writto.MarkdownFile"

  ; Set file type description and icon
  WriteRegStr HKCR "Writto.MarkdownFile" "" "Markdownファイル"
  WriteRegStr HKCR "Writto.MarkdownFile\DefaultIcon" "" "$INSTDIR\Writto.exe,0"
  WriteRegStr HKCR "Writto.MarkdownFile\shell" "" "open"
  WriteRegStr HKCR "Writto.MarkdownFile\shell\open" "" "Writtoで開く(&O)"
  WriteRegStr HKCR "Writto.MarkdownFile\shell\open\command" "" '"$INSTDIR\Writto.exe" "%1"'
    
  ; Windowsに変更を通知
  System::Call 'shell32.dll::SHChangeNotify(i, i, i, i) v (0x08000000, 0, 0, 0)'
SectionEnd

; アンインストール時のクリーンアップ
Section un.ShellAssoc
  ; Restore the previously associated file class
  ReadRegStr $R0 HKCR ".md" "Writto.MarkdownFile_backup"
  WriteRegStr HKCR ".md" "" "$R0"

  ; Delete Writto.MarkdownFile registry keys
  DeleteRegKey HKCR "Writto.MarkdownFile"
  
  ; Windowsに変更を通知
  System::Call 'shell32.dll::SHChangeNotify(i, i, i, i) v (0x08000000, 0, 0, 0)'
SectionEnd

