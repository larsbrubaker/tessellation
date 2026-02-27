# Build the WASM package for the tessellation demo
Push-Location $PSScriptRoot\wasm
wasm-pack build --target web --out-dir ..\public\pkg
Pop-Location
