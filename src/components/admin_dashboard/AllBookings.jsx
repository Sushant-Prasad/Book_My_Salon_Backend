import React from 'react'
import BookYourSlot from '../BookYourSlot'
import { useLocation } from 'react-router-dom';

const AllBookings = () => {
const location = useLocation();
  return (
    <>
        <BookYourSlot path={location.pathname}/>
    </>
  )
}

export default AllBookings