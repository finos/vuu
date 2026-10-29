#!/usr/bin/env bash
#
# Packages the Keycloak theme(s) in this folder as a theme JAR for
# /opt/keycloak/providers.
#
# Usage: ./build-jar.sh [version]
#   version defaults to the vuu-ui package.json version.
#
# Every folder here that holds <type>/theme.properties (e.g. vuu/login) is a
# theme. The JAR contains each one under theme/<name>/ plus the
# META-INF/keycloak-themes.json manifest Keycloak uses to find them.

set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
package_json="$here/../../package.json"

version="${1:-}"
if [[ -z "$version" ]]; then
  version="$(sed -n 's/^  "version": "\(.*\)",$/\1/p' "$package_json" | head -n 1)"
fi
if [[ -z "$version" ]]; then
  echo "Could not read a version from $package_json; pass one as an argument." >&2
  exit 1
fi

dist="$here/dist"
jar_file="$dist/vuu-keycloak-theme-$version.jar"
staging="$(mktemp -d)"
trap 'rm -rf "$staging"' EXIT

mkdir -p "$staging/META-INF" "$staging/theme"

theme_entries=()
for theme_dir in "$here"/*/; do
  name="$(basename "$theme_dir")"
  types=()
  for type_dir in "$theme_dir"*/; do
    [[ -f "$type_dir/theme.properties" ]] && types+=("\"$(basename "$type_dir")\"")
  done
  [[ ${#types[@]} -eq 0 ]] && continue
  cp -R "$theme_dir" "$staging/theme/$name"
  theme_entries+=("    { \"name\": \"$name\", \"types\": [$(IFS=,; echo "${types[*]}" | sed 's/,/, /g')] }")
done

if [[ ${#theme_entries[@]} -eq 0 ]]; then
  echo "No themes found under $here" >&2
  exit 1
fi

{
  echo "{"
  echo "  \"themes\": ["
  for i in "${!theme_entries[@]}"; do
    sep=","
    [[ $i -eq $((${#theme_entries[@]} - 1)) ]] && sep=""
    echo "${theme_entries[$i]}$sep"
  done
  echo "  ]"
  echo "}"
} > "$staging/META-INF/keycloak-themes.json"

# Leave out editor and OS clutter
find "$staging" \( -name .DS_Store -o -name '*~' -o -name '*.swp' \) -delete

mkdir -p "$dist"
rm -f "$jar_file"

if command -v zip >/dev/null 2>&1; then
  (cd "$staging" && zip -qrX "$jar_file" META-INF theme)
elif command -v jar >/dev/null 2>&1; then
  jar --create --file "$jar_file" -C "$staging" META-INF -C "$staging" theme
else
  echo "Needs either zip or a JDK's jar tool on the PATH." >&2
  exit 1
fi

echo "Built $jar_file"
echo "Themes:"
sed -n 's/^    { "name": "\(.*\)", "types": \[\(.*\)\] },\{0,1\}$/  \1 (\2)/p' \
  "$staging/META-INF/keycloak-themes.json"
