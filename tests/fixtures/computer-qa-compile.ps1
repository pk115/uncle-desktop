param([string]$Output)
$ErrorActionPreference='Stop'
Add-Type -Path (Join-Path $PSScriptRoot 'computer-qa.cs') -OutputAssembly $Output -OutputType WindowsApplication -ReferencedAssemblies System.Windows.Forms,System.Drawing
