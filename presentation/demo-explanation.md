Each screen asks one money choice: take a smaller amount sooner, or a larger amount later. The computer is trying to learn how this person trades off money against waiting.

After each answer, the model updates two guesses about the person. The first guess is `k`, which is how strongly delay reduces the value of money for them. A higher `k` means waiting feels more costly. The second is `τ`, which is how consistent their choices are. A higher `τ` means their choices closely follow the model’s value calculation; a lower `τ` means their answers are noisier.

The plots at the bottom show those two guesses changing over the experiment. The line is the current best estimate. The shaded region is uncertainty. Ideally, as more answers come in, the uncertainty shrinks and the line settles.

The plot in the upper right is about the experiment’s question-choosing strategy. The blue line shows how useful the computer expected each chosen question to be before the participant answered. The red line shows how much the answer actually taught the model afterward.

So the main idea is: we are not just showing random money choices. The experiment is choosing each next question based on what it has learned so far, and the debug plots let us watch that learning process happen.
