import { sendLogs } from './utils.js';

// Function to create task form
var user_session_id = 'user1';

export function createTaskForm() {

  const taskview = document.getElementById('taskview');
  taskview.innerHTML = ''; 

  const formTitle = document.createElement('h2');
  formTitle.classList.add('task-form-title');
  formTitle.innerText = 'Exploration Task';

  const questions = [
    "\n What birdstrikes should the FAA be most concerned about? \n \n"
  ];

  const form = document.createElement('form');
  form.id = 'taskForm';

  questions.forEach((question, index) => {
    const formGroup = document.createElement('div');
    formGroup.classList.add('form-group');

    const label = document.createElement('label');
    label.innerText = `${question}`;
    label.style.display = 'block';
    label.style.width = '100%';
    formGroup.appendChild(label);

    const input = document.createElement('textarea');
    input.name = `answer${index}`;
    input.classList.add('form-control');
    input.style.width = '90%';
    input.style.height = '250px'; // Increase the height of the input box
    input.style.overflowY = 'scroll'; // Make it scrollable if content exceeds height
    formGroup.appendChild(input);

    // Load saved value from local storage
    const savedValue = localStorage.getItem(`answer${index}`);
    if (savedValue) {
      input.value = savedValue;
    }

    input.addEventListener('input', function() {
      // Save value to local storage on input change
      import('./StoreLogs.js').then(module => {
            module.storeInteractionLogs('Taking notes', input.value, new Date());
        })
      
    //   console.log('task form input', input.value);
      localStorage.setItem(`answer${index}`, input.value);
    });

    form.appendChild(formGroup);
  });

  const submitButton = document.createElement('button');
  submitButton.type = 'button';
  submitButton.innerText = 'Submit';
  submitButton.classList.add('btn');
  submitButton.onclick = sendLogs;
  form.appendChild(submitButton);



  taskview.appendChild(formTitle);
  taskview.appendChild(form);

  // submit button click event
  submitButton.addEventListener('click', function() {
    import('./StoreLogs.js').then(module => {
        module.storeInteractionLogs('Task Complete for User', {
            sessionid: user_session_id,
            algorithm: app.sumview._algorithm,
            baseline: app.sumview._baseline
          }, new Date());
    })
    
        sendLogs();
    })
}