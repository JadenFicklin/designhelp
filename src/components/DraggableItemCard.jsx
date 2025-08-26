import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import ItemCard from './ItemCard';

const DraggableItemCard = ({ item, index }) => {
  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`${snapshot.isDragging ? 'opacity-50' : ''}`}
        >
          <ItemCard item={item} />
        </div>
      )}
    </Draggable>
  );
};

export default DraggableItemCard;
