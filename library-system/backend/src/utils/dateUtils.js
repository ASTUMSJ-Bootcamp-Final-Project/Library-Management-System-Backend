function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Update overdue books status
const updateOverdueBooks = async (Borrow) => {
  try {
    const result = await Borrow.updateMany(
      {
        status: "borrowed",
        dueDate: { $lt: new Date() }
      },
      {
        $set: { status: "overdue" }
      }
    );
    return result.modifiedCount;
  } catch (error) {
    console.error("Error updating overdue books:", error);
    return 0;
  }
};

// Cancel expired reservations and restore available copies
const cancelExpiredReservations = async (Borrow, Book) => {
  try {
    const now = new Date();
    
    // Find expired reservations
    const expiredReservations = await Borrow.find({
      status: "reserved",
      reservationExpiry: { $lt: now }
    });

    let cancelledCount = 0;
    
    for (const reservation of expiredReservations) {
      // Update reservation status
      reservation.status = "expired";
      await reservation.save();

      // Restore available copies
      const book = await Book.findById(reservation.book);
      if (book) {
        book.availableCopies += 1;
        await book.save();
      }
      
      cancelledCount++;
    }

    console.log(`Cancelled ${cancelledCount} expired reservations`);
    return cancelledCount;
  } catch (error) {
    console.error("Error cancelling expired reservations:", error);
    return 0;
  }
};

// Run maintenance tasks (overdue books + expired reservations)
const runMaintenanceTasks = async (Borrow, Book) => {
  try {
    const overdueCount = await updateOverdueBooks(Borrow);
    const expiredCount = await cancelExpiredReservations(Borrow, Book);
    
    console.log(`Maintenance completed: ${overdueCount} overdue books updated, ${expiredCount} expired reservations cancelled`);
    return { overdueCount, expiredCount };
  } catch (error) {
    console.error("Error running maintenance tasks:", error);
    return { overdueCount: 0, expiredCount: 0 };
  }
};

module.exports = { 
  addDays, 
  updateOverdueBooks, 
  cancelExpiredReservations,
  runMaintenanceTasks
};
