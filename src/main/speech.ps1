param([ValidateSet('voices','speak')][string]$Action = 'voices')
$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media.SpeechSynthesis, ContentType=WindowsRuntime]
$voices = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices
if ($Action -eq 'voices') {
  @($voices | ForEach-Object { @{ id=$_.Id; name=$_.DisplayName; lang=$_.Language } }) | ConvertTo-Json -Compress
  exit 0
}
function AwaitOperation($operation, [Type]$resultType) {
  $method = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
  $task = $method.MakeGenericMethod($resultType).Invoke($null, @($operation))
  $task.GetAwaiter().GetResult()
}
$request = [Console]::In.ReadToEnd() | ConvertFrom-Json
$voice = $voices | Where-Object { $_.Id -eq $request.voice } | Select-Object -First 1
if (!$voice) { throw 'Voice not installed' }
$synth = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer
$synth.Voice = $voice
$synth.Options.SpeakingRate = [double]$request.rate
try {
  $stream = AwaitOperation ($synth.SynthesizeTextToStreamAsync([string]$request.text)) ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])
  $reader = New-Object Windows.Storage.Streams.DataReader($stream)
  try {
    $null = AwaitOperation ($reader.LoadAsync([uint32]$stream.Size)) ([uint32])
    $bytes = New-Object byte[] ([int]$stream.Size)
    $reader.ReadBytes($bytes)
    @{ audio=[Convert]::ToBase64String($bytes) } | ConvertTo-Json -Compress
  } finally { $reader.Dispose(); $stream.Dispose() }
} finally { $synth.Dispose() }
