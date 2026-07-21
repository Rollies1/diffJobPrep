$files = Get-ChildItem -Path . -Recurse -Filter *Controller.java
$out = ""
foreach ($f in $files) {
    $out += "=== " + $f.FullName + " ===`n" + (Get-Content $f.FullName -Raw) + "`n`n"
}
Set-Content -Path combined_controllers.txt -Value $out
