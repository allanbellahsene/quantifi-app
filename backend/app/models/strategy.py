from pydantic import BaseModel, validator
from typing import List

class Rule(BaseModel):
    left_indicator: str
    left_window: int
    right_indicator: str
    right_window: int
    comparison: str
    action: str

    @validator('comparison')
    def validate_comparison(cls, v):
        valid_comparisons = ['>', '<', '==', '>=', '<=']
        if v not in valid_comparisons:
            raise ValueError(f"Invalid comparison. Must be one of {valid_comparisons}")
        return v

    @validator('action')
    def validate_action(cls, v):
        valid_actions = ['Buy', 'Sell']
        if v not in valid_actions:
            raise ValueError(f"Invalid action. Must be one of {valid_actions}")
        return v

class Strategy(BaseModel):
    name: str
    rules: List[Rule]

    @validator('rules')
    def validate_rules(cls, v):
        if len(v) == 0:
            raise ValueError("Strategy must have at least one rule")
        return v