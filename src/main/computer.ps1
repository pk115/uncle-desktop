$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Add-Type -Path (Join-Path $PSScriptRoot 'computer-native.cs') -ReferencedAssemblies UIAutomationClient,UIAutomationTypes,WindowsBase,System.Drawing
Add-Type -Path (Join-Path $PSScriptRoot 'computer-audio.cs')
[UncleComputer]::Init([int]$args[0],[string]$args[1])
while ($null -ne ($line = [Console]::ReadLine())) {
  try {
    $request = $line | ConvertFrom-Json
    $result = switch ($request.action) {
      'cursor' { [UncleComputer]::Cursor() }
      'windows' { [UncleComputer]::Windows() }
      'read' { [UncleComputer]::Read([long]$request.window) }
      'audio' { [UncleAudio]::Apply([string]$request.text,[double]$request.level) }
      'sleep' { [UncleComputer]::Sleep() }
      'now_playing' {
        Add-Type -AssemblyName System.Runtime.WindowsRuntime
        function Await-WinRT($Operation,$ResultType) {
          $method=[System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
          $task=$method.MakeGenericMethod($ResultType).Invoke($null,@($Operation))
          if(-not $task.Wait(5000)){throw 'Media session timed out'}
          return $task.Result
        }
        $manager=Await-WinRT ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime])
        $session=$manager.GetCurrentSession()
        if($null -eq $session){@{title='';artist='';status='None'}}else{
          $properties=Await-WinRT ($session.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties,Windows.Media.Control,ContentType=WindowsRuntime])
          @{title=$properties.Title;artist=$properties.Artist;album=$properties.AlbumTitle;status=$session.GetPlaybackInfo().PlaybackStatus.ToString()}
        }
      }
      'picture' { [UncleComputer]::Picture([long]$request.window) }
      default { [UncleComputer]::Act($request.action,[long]$request.window,[int]$request.target,[int]$request.x,[int]$request.y,[string]$request.text,[int]$request.endX,[int]$request.endY,[int]$request.duration) }
    }
    [Console]::WriteLine((@{id=$request.id;ok=$true;value=$result} | ConvertTo-Json -Depth 12 -Compress))
  } catch { [Console]::WriteLine((@{id=$request.id;ok=$false;error=$_.Exception.Message} | ConvertTo-Json -Compress)) }
}
