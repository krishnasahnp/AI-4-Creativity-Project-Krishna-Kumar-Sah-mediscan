
import asyncio
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db import get_db, Study, Series, Image, async_session_maker

async def check_latest_study():
    async with async_session_maker() as db:
        # Get the most recent study
        result = await db.execute(
            select(Study)
            .order_by(Study.created_at.desc())
            .options(
                selectinload(Study.series_list).selectinload(Series.images)
            )
            .limit(1)
        )
        study = result.scalar_one_or_none()
        
        if not study:
            print("No studies found.")
            return

        print(f"Study ID: {study.id}")
        print(f"Modality: {study.modality}")
        print(f"Series Count: {len(study.series_list)}")
        
        if study.series_list:
            s = study.series_list[0]
            print(f"Series 1 ID: {s.id}")
            print(f"Image Count: {len(s.images)}")
            if s.images:
                img = s.images[0]
                print(f"Image 1 Path: {img.file_path}")
                print(f"Image 1 ID: {img.id}")

if __name__ == "__main__":
    asyncio.run(check_latest_study())
