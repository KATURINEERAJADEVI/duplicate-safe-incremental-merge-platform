from typing import List, Dict, Any, Tuple

def compare_schemas(columns_a: List[str], columns_b: List[str]) -> Tuple[List[str], List[str], List[str], bool, str]:
    """
    Compares two lists of columns from Dataset A and Dataset B.
    Returns:
    - common_columns
    - a_only_columns
    - b_only_columns
    - is_compatible (True if at least one shared column can form a business key)
    - compatibility_reason
    """
    set_a = set(columns_a)
    set_b = set(columns_b)
    
    common = [c for c in columns_a if c in set_b]
    a_only = [c for c in columns_a if c not in set_b]
    b_only = [c for c in columns_b if c not in set_a]
    
    if not common:
        return common, a_only, b_only, False, "Dataset schemas are incompatible. There are no shared columns to establish record identity or business keys."
        
    return common, a_only, b_only, True, f"Found {len(common)} common column(s) available for business key selection."

def suggest_business_keys(common_columns: List[str]) -> List[List[str]]:
    """
    Suggests high-priority composite or single business keys based on standard data engineering conventions.
    """
    candidates = []
    
    # Priority patterns
    id_cols = [c for c in common_columns if any(k in c.lower() for k in ['id', 'key', 'code', 'num'])]
    
    # Common composite candidates
    if 'customer_id' in common_columns and 'transaction_id' in common_columns:
        candidates.append(['customer_id', 'transaction_id'])
        
    if 'account_id' in common_columns and 'transaction_id' in common_columns:
        candidates.append(['account_id', 'transaction_id'])

    if 'user_id' in common_columns and 'order_id' in common_columns:
        candidates.append(['user_id', 'order_id'])

    # Single ID columns
    for col in common_columns:
        if col.lower() in ['transaction_id', 'order_id', 'record_id', 'id', 'uuid']:
            if [col] not in candidates:
                candidates.append([col])
                
    # Fallback to any ID column
    for col in id_cols:
        if [col] not in candidates and len(candidates) < 5:
            candidates.append([col])
            
    # Default fallback: first common column
    if not candidates and common_columns:
        candidates.append([common_columns[0]])
        
    return candidates
