#app.api.price.py
from typing     import List
from fastapi    import APIRouter, HTTPException, Depends

from sqlalchemy.orm import Session

from app.core.database  import get_db
from app.core.jwt_token import botadmin_required

from app.models.user    import UserSchema
from app.models.price   import Price, PriceTimeSeries

router = APIRouter()

@router.post("/post", response_model=dict)
async def save_prices(
                        prices: List[PriceTimeSeries],
                        current_user: UserSchema = Depends(botadmin_required),
                        db: Session = Depends(get_db)
                    ):
    """
    Save a list of prices to the database.
    
    Args:
        prices: A list of PriceTimeSeries objects (validated via Pydantic).
        db: SQLAlchemy session for database interaction.
    
    Returns:
        A success message with the number of rows added.
    """
    try:
        price_objects = [
            Price(
                symbol=p.symbol,
                market=p.market,
                time=p.time,
                open=p.open,
                high=p.high,
                low=p.low,
                close=p.close,
            )
            for p in prices
        ]
        db.bulk_save_objects(price_objects)
        db.commit()
        return {"message": f"Successfully added {len(price_objects)} prices."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error saving prices: {e}")

@router.get("/", response_model=List[PriceTimeSeries])
async def get_prices(market: str, symbol: str, start_time: float, end_time: float, db: Session = Depends(get_db)):
    """
    Retrieve prices from the database based on a time range.
    
    Args:
        market: The market to filter by.
        symbol: The symbol to filter by.
        start_time: Start of the time range (UNIX timestamp).
        end_time: End of the time range (UNIX timestamp).
        db: SQLAlchemy session for database interaction.
    
    Returns:
        A list of PriceTimeSeries objects.
    """
    prices = (
        db.query(Price)
            .filter(
                Price.market == market,
                Price.symbol == symbol,
                Price.time >= start_time,
                Price.time <= end_time,
            )
            .all()
    )
    if not prices:
        raise HTTPException(status_code=404, detail="No prices found in the given range.")
    
    return [
        PriceTimeSeries(
            symbol=p.symbol,
            market=p.market,
            time=p.time,
            open=p.open,
            high=p.high,
            low=p.low,
            close=p.close,
        )
        for p in prices
    ]
