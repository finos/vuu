import {
  addDays,
  subDays,
  addMonths,
  differenceInCalendarDays,
  isSameDay,
  isSameMonth,
  subMonths,
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSunday
} from 'date-fns';

const DAY_D = 'd';

export default class CalendarModel {
  constructor({
    selectedDate = null,
    currentDate = selectedDate || new Date(),
    currentMonth = currentDate
  }) {
    this.currentDate = currentDate;
    this.currentMonth = currentMonth;
    this.selectedDate = selectedDate;
  }

  setCurrentMonth(currentMonth) {
    return new CalendarModel({
      currentMonth,
      currentDate: this.currentDate
    });
  }

  nextMonth() {
    return (this.currentMonth = addMonths(this.currentMonth, 1));
  }

  prevMonth() {
    return (this.currentMonth = subMonths(this.currentMonth, 1));
  }

  nextDate(key) {
    switch (key) {
      case 'ArrowDown':
        return (this.currentDate = addDays(this.currentDate, 7));
      case 'ArrowUp':
        return (this.currentDate = subDays(this.currentDate, 7));
      case 'ArrowLeft':
        return (this.currentDate = subDays(this.currentDate, 1));
      case 'ArrowRight':
        return (this.currentDate = addDays(this.currentDate, 1));
      // case StateEvt.PAGEUP.type:
      //   return this.currentDate = subMonths(this.currentDate, 1);
      // case StateEvt.PAGEDOWN.type:
      //   return this.currentDate = addMonths(this.currentDate, 1);
      case 'Home':
        return (this.currentDate = startOfMonth(this.currentDate));
      case 'End':
        return (this.currentDate = endOfMonth(this.currentDate));
      default:
    }
  }
}

// TODO accept start day of week as param
export const getDisplayStart = (date) => {
  let displayStart = startOfMonth(date);
  if (isSunday(displayStart)) {
    displayStart = subDays(displayStart, 7);
  }
  return displayStart;
};

export function getDates(currentMonth = new Date(), selectedDate = null) {
  console.log(`getDates ${currentMonth}`);
  let displayStart = getDisplayStart(currentMonth);
  let displayEnd = endOfMonth(currentMonth);
  let startDate = startOfWeek(displayStart);
  let endDate = endOfWeek(displayEnd);
  const weeks = [];

  const periodDays = differenceInCalendarDays(endDate, startDate) + 1;
  if (periodDays === 35) {
    const startDiff = differenceInCalendarDays(displayStart, startDate);
    const endDiff = differenceInCalendarDays(endDate, displayEnd);
    if (startDiff < endDiff) {
      startDate = subDays(startDate, 7);
    } else {
      endDate = addDays(endDate, 7);
    }
  }

  let day = startDate;
  while (day <= endDate) {
    const week = { days: [], otherMonth: false };
    for (let i = 0; i < 7; i++) {
      week.days.push({
        day,
        formattedDate: format(day, DAY_D),
        otherMonth: !isSameMonth(day, currentMonth),
        disabled: false,
        selected: isSameDay(day, selectedDate)
      });
      day = addDays(day, 1);
    }

    if (week.days.every((day) => day.otherMonth)) {
      week.otherMonth = true;
    }
    weeks.push(week);
  }

  return weeks;
}
// export function getDates(currentMonth=new Date(), selectedDate=null, leadingMonth=null, trailingMonth=null){
//   console.log(`getDates ${currentMonth}`)
//   const displayStart = startOfMonth(leadingMonth || currentMonth);
//   const displayEnd = endOfMonth(trailingMonth || currentMonth);
//   const startDate = startOfWeek(displayStart);
//   const endDate = endOfWeek(displayEnd);
//   const weeks = [];

//   let day = startDate;
//   while (day <= endDate) {
//     const week = {days:[], otherMonth: false};
//     for (let i = 0; i < 7; i++) {
//       week.days.push({
//         day,
//         formattedDate: format(day, DAY_D),
//         otherMonth: !isSameMonth(day, currentMonth),
//         disabled: false,
//         selected: isSameDay(day, selectedDate)
//       });
//       day = addDays(day, 1);
//     }

//     if (week.days.every(day => day.otherMonth)){
//       week.otherMonth = true;
//     }
//     console.log({week})
//     weeks.push(week);
//   }
//   return weeks;

// }

export function getCalendarClassNames(weeks) {
  // const currentWeeks = weeks.filter(week => !week.otherMonth)
  const currentWeeks = weeks;
  const currentWeekCount = currentWeeks.length;
  const otherWeekCount = weeks.length - currentWeekCount;
  const className = `weeks-in-month-${currentWeekCount}`;

  if (weeks[0].otherMonth) {
    return [className, `other-weeks-leading-${otherWeekCount}`];
  } else if (weeks[weeks.length - 1].otherMonth) {
    return [className, `other-weeks-trailing-${otherWeekCount}`];
  } else {
    return [className];
  }
}
