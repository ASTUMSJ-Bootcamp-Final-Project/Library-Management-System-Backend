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

module.exports = { addDays, updateOverdueBooks };
