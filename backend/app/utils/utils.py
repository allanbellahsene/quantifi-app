import pandas as pd
import numpy as np
from typing import  Any

def numpy_to_python(obj: Any) -> Any:
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, pd.Timestamp):
        return obj.strftime('%Y-%m-%d')
    else:
        return obj

def nan_to_null(obj):
    if isinstance(obj, float) and np.isnan(obj):
        return None
    elif isinstance(obj, dict):
        return {k: nan_to_null(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [nan_to_null(v) for v in obj]
    return obj