gawk -f "insert_record_splitter.awk" "changes.csv"
gawk -f "extract_changes.awk" "changes2.csv"