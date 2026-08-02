import uuid
from typing import Any, Generic, List, Optional, Sequence, Type, TypeVar
from sqlalchemy import Select, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database.base import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)


class BaseRepository(Generic[ModelType]):
    """Generic async repository providing CRUD operations, soft deletes, and pagination."""

    def __init__(self, model: Type[ModelType], session: AsyncSession):
        self.model = model
        self.session = session

    async def get_by_id(
        self,
        id: uuid.UUID,
        include_deleted: bool = False
    ) -> Optional[ModelType]:
        query = select(self.model).where(self.model.id == id)
        if not include_deleted:
            query = query.where(self.model.is_deleted == False)
        result = await self.session.execute(query)
        return result.scalars().first()

    async def find_all(
        self,
        skip: int = 0,
        limit: int = 100,
        include_deleted: bool = False,
        order_by_desc: bool = True
    ) -> Sequence[ModelType]:
        query = select(self.model)
        if not include_deleted:
            query = query.where(self.model.is_deleted == False)
        
        order_col = getattr(self.model, "created_at", self.model.id)
        if order_by_desc:
            query = query.order_by(order_col.desc())
        else:
            query = query.order_by(order_col.asc())

        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def count(self, include_deleted: bool = False) -> int:
        query = select(func.count(self.model.id))
        if not include_deleted:
            query = query.where(self.model.is_deleted == False)
        result = await self.session.execute(query)
        return result.scalar_one()

    async def create(self, instance: ModelType) -> ModelType:
        self.session.add(instance)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def create_many(self, instances: List[ModelType]) -> List[ModelType]:
        self.session.add_all(instances)
        await self.session.flush()
        return instances

    async def update(self, instance: ModelType, update_data: dict[str, Any]) -> ModelType:
        for field, value in update_data.items():
            if hasattr(instance, field) and value is not None:
                setattr(instance, field, value)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def soft_delete(self, id: uuid.UUID) -> bool:
        instance = await self.get_by_id(id)
        if not instance:
            return False
        instance.soft_delete()
        await self.session.flush()
        return True
