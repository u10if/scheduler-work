<!DOCTYPE html>
<html lang="fa" dir="rtl">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Work Scheduler</title>
    <link href="https://fonts.googleapis.com/css2?family=Vazir&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/moment-jalaali@0.9.2/build/moment-jalaali.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.js"></script>
    <style>
        body {
            background-color: #AEC3AE;
            font-family: 'Vazir', sans-serif;
            padding: 20px;
            display: flex;
            flex-wrap: wrap;
            flex-direction: row-reverse;
            justify-content: space-between;
        }

        .month {
            width: 100%;
            margin-bottom: 20px;
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
        }

        .month-title {
            text-align: center;
            font-weight: bold;
            margin-bottom: 10px;
            width: 100%;
        }

        .cell {
            text-align: center;
            background-color: #E4E4D0;
            border: 1px solid #ccc;
            padding: 10px;
            margin: 5px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            width: calc(100% / 6 - 20px);
            height: 200px;
            margin-bottom: 5px;
            position: relative;
            overflow: hidden;
        }

        .today {
            border: 2px solid #053B50;
        }

        .notes {
            max-height: 100px;
            overflow-y: auto;
        }

        .cell input[type="text"] {
            width: 90%;
            margin-top: 10px;
        }

        .note {
            position: relative;
            border-bottom: 1px solid #ccc;
            margin-top: 10px;
            padding-bottom: 10px;
            padding-right: 20px;
            display: flex;
            align-items: center;
        }

        .deleteNote,
        .doneIcon,
        .undoneIcon {
            margin-left: 10px;
            cursor: pointer;
        }

        .doneIcon,
        .undoneIcon {
            display: none;
        }

        .collapsed .cell {
            display: none;
        }
           .doneNote {
        text-decoration: line-through;
        color: #888;
    }

        @media (max-width: 768px) {
            .month {
                flex-direction: column;
            }

            .cell {
                width: 100%;
            }
        }

        /* Styles for the modal */
        .modal {
            display: none;
            position: fixed;
            z-index: 1;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0, 0, 0, 0.7);
        }

        .modal-content {
            position: relative;
            background-color: #fefefe;
            margin: 15% auto;
            padding: 20px;
            border: 1px solid #888;
            width: 70%;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .close {
            color: #aaa;
            float: left;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }
    </style>
</head>

<body>

<<body>
<div id="app">
    <div v-for="month in months" class="month" :class="{ collapsed: month.collapsed }">
        <div class="month-title">
            {{ month.title }}
            <button @click="month.collapsed = !month.collapsed">hide/show</button>
        </div>
        <div v-for="day in month.days" class="cell" :class="{ today: day.isToday }">
            <div>{{ day.dayName }}</div>
            <div>{{ day.date }}</div>
            <!-- Display notes within the column -->
            <div class="notes">
                <div v-for="note in day.notes" class="note">
                    <span v-if="note.done" class="doneNote">{{ note.text }}</span>
                    <span v-else>{{ note.text }}</span>
                </div>
            </div>
            <button @click="showNotesForDay(day)">Manage Notes</button>
        </div>
    </div>
      <!-- The Modal -->
    <div v-if="selectedDay" class="modal" @click="closeModal">
        <div class="modal-content" @click.stop>
            <span class="close" @click="closeModal">&times;</span>
            <h2>Notes for {{ selectedDay.date }}</h2>
            <div class="notes">
                <div v-for="note in selectedDay.notes" class="note">
                    <input type="checkbox" v-model="note.done" @change="saveNotes(selectedDay)">
                    {{ note.text }}
                    <span class="deleteNote" @click="deleteNote(selectedDay, note)"><i class="fas fa-trash"></i></span>
                </div>
            </div>
            <input type="text" v-model="newNoteText" placeholder="Add new note..." @keyup.enter="addNoteToSelectedDay">
        </div>
    </div>
</div>

<script>
    new Vue({
        el: '#app',
        data: {
            months: [],
            selectedDay: null,
            newNoteText: ''
        },
        created() {
            this.initializeSchedule();
            this.loadNotesFromLocalStorage();
        },
        methods: {
            initializeSchedule() {
                const startDate = moment().startOf('month');
                const currentMonth = moment().format('jMMMM jYYYY');
                for (let i = 0; i < 180; i++) {
                    const cellDate = startDate.clone().add(i, 'days');
                    const monthIndex = this.months.findIndex(month => month.title === cellDate.format('jMMMM jYYYY'));
                    const day = {
                        date: cellDate.format('jYYYY/jM/jD'),
                        dayName: cellDate.format('dddd'),
                        isToday: cellDate.format('jYYYY/jM/jD') === moment().format('jYYYY/jM/jD'),
                        notes: [],
                        newNote: ''
                    };
                    if (monthIndex === -1) {
                        this.months.push({
                            title: cellDate.format('jMMMM jYYYY'),
                            days: [day],
                            collapsed: cellDate.format('jMMMM jYYYY') !== currentMonth
                        });
                    } else {
                        this.months[monthIndex].days.push(day);
                    }
                }
            },
            addNote(day) {
                if (day.newNote.trim() !== '') {
                    day.notes.unshift({
                        text: day.newNote,
                        done: false
                    });
                    day.newNote = '';
                    this.saveNotes(day);
                }
            },
            deleteNote(day, note) {
                const index = day.notes.indexOf(note);
                if (index !== -1) {
                    day.notes.splice(index, 1);
                    this.saveNotes(day);
                }
            },
            saveNotes(day) {
                localStorage.setItem(`notes${day.date}`, JSON.stringify(day.notes));
            },
            loadNotesFromLocalStorage() {
                this.months.forEach(month => {
                    month.days.forEach(day => {
                        const savedNotes = JSON.parse(localStorage.getItem(`notes${day.date}`) || '[]');
                        day.notes = savedNotes;
                    });
                });
            },
            showNotesForDay(day) {
                this.selectedDay = day;
                const modal = document.querySelector('.modal');
                modal.style.display = 'block';
            },
            closeModal() {
                const modal = document.querySelector('.modal');
                modal.style.display = 'none';
            },
            addNoteToSelectedDay() {
                if (this.newNoteText.trim() !== '') {
                    this.selectedDay.notes.unshift({
                        text: this.newNoteText,
                        done: false
                    });
                    this.newNoteText = '';
                    this.saveNotes(this.selectedDay);
                }
            }
        }
    });
</script>
</body>
</html>
