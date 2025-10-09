# save as: make_dirlist.sh
# usage:
#   chmod +x make_dirlist.sh
#   ./make_dirlist.sh            # normal (hides dotfiles)
#   ./make_dirlist.sh -a         # include hidden files/dirs
#   ./make_dirlist.sh -o mylist  # set output prefix

#!/bin/sh
set -e

INCLUDE_HIDDEN=0
OUT_PREFIX="dirlist_$(date +"%Y%m%d-%H%M%S")"

# parse flags
while getopts "ao:" opt; do
  case "$opt" in
    a) INCLUDE_HIDDEN=1 ;;
    o) OUT_PREFIX="$OPTARG" ;;
    *) echo "Usage: $0 [-a] [-o output_prefix]"; exit 1 ;;
  esac
done

TREE_FILE="${OUT_PREFIX}.txt"
CSV_FILE="${OUT_PREFIX}.csv"

# Build find commands without arrays (portable)
if [ "$INCLUDE_HIDDEN" -eq 1 ]; then
  FIND_DIRS='find . -type d'
  FIND_FILES='find . -type f'
  FIND_ALL='find "$(pwd)" -print0'
else
  # prune hidden anywhere in the path
  FIND_DIRS='find . -type d -not -path "*/.*" -not -name ".*"'
  FIND_FILES='find . -type f -not -path "*/.*" -not -name ".*"'
  FIND_ALL='find "$(pwd)" -not -path "*/.*" -not -name ".*" -print0'
fi

echo "Creating tree list: $TREE_FILE"
{
  echo "Directory tree for: $(pwd)"
  echo "Generated: $(date)"
  echo
  # list dirs first, then files, sorted; draw a simple ASCII tree
  {
    eval "$FIND_DIRS" | sort
    eval "$FIND_FILES" | sort
  } | awk '
    BEGIN { FS="/" }
    {
      gsub(/^\.\//,"",$0)
      path=$0
      if (path=="") path="."
      n = split(path, parts, "/")
      indent=""
      for (i=1; i<n; i++) indent=indent "│  "
      prefix=(n>1 ? "└─ " : "")
      print indent prefix path
    }
  '
} > "$TREE_FILE"

echo "Creating CSV: $CSV_FILE"
{
  echo "path,type,size_bytes,modified_iso"
  # Read NUL-delimited to be safe with spaces
  eval "$FIND_ALL" | \
  while IFS= read -r -d '' item; do
    if [ -d "$item" ]; then
      typ="dir"; size=""
    elif [ -f "$item" ]; then
      typ="file"; size=$(stat -f "%z" "$item" 2>/dev/null || echo "")
    else
      continue
    fi
    mod=$(stat -f "%Sm" -t "%Y-%m-%dT%H:%M:%S%z" "$item" 2>/dev/null || echo "")
    p=$(printf '%s' "$item" | sed 's/"/""/g')
    printf '"%s",%s,%s,%s\n' "$p" "$typ" "$size" "$mod"
  done
} > "$CSV_FILE"

echo "Done."
echo "Tree view : $TREE_FILE"
echo "CSV export: $CSV_FILE"

