import React, { useEffect, useState } from "react";
import NewTicketForm from "./NewTicketForm";
import TicketList from "./TicketList";
import EditTicketForm from "./EditTicketForm";
import TicketDetail from "./TicketDetail";
import db from "./../firebase.js";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

function TicketControl() {
  // constructor(props) {
  //   super(props);
  //   this.state = {
  //     formVisibleOnPage: false,
  //     mainTicketList: [],
  //     selectedTicket: null,
  //     editing: false
  //   };
  // }
  const [formVisibleOnPage, setFormVisibleOnPage] = useState(false);
  const [mainTicketList, setMainTicketList] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unSubscribe = onSnapshot(
      collection(db, "tickets"),
      (collectionSnapshot) => {
        const tickets = [];
        collectionSnapshot.forEach((doc) => {
          tickets.push({
            names: doc.data().names,
            location: doc.data().location,
            issue: doc.data().issue,
            id: doc.id,
          });
        });
        setMainTicketList(tickets);
      },
      (error) => {
        setError(error.message);
      }
    );

    return () => unSubscribe();
  }, []);

  const handleClick = () => {
    if (selectedTicket != null) {
      setFormVisibleOnPage(false);
      setEditing(false);
    } else {
      setFormVisibleOnPage(!formVisibleOnPage);
    }
  };

  const handleDeletingTicket = async (id) => {
    await deleteDoc(doc(db, "tickets", id));
    setSelectedTicket(null);
  };
    // setMainTicketList(newMainTicketList);
    // const newMainTicketList = this.state.mainTicketList.filter(
    //   (ticket) => ticket.id !== id
    // );
    // this.setState({
    //   mainTicketList: newMainTicketList,
    //   selectedTicket: null,
    // });
  // };

  const handleEditClick = () => {
    // this.setState({ editing: true });
    setEditing(true);
  };

  const handleEditingTicketInList = async (ticketToEdit) => {
    const ticketRef = doc(db, "tickets", ticketToEdit.id);
    await updateDoc(ticketRef, ticketToEdit);
    setEditing(false);
    setSelectedTicket(null);
  }

  const handleAddingNewTicketToList = async (newTicketData) => {
    const collectionRef = collection(db, "tickets");
    await addDoc(collectionRef, newTicketData);
    setFormVisibleOnPage(false);
  };

  //same as above
  // const handleAddingNewTicketToList = async (newTicketData) => {
  //   await addDoc(collection(db, "tickets"), newTicketData);
  //   setFormVisibleOnPage(false);
  // }

  // const handleAddingNewTicketToList = (newTicket) => {
  //   const newMainTicketList = mainTicketList.concat(newTicket);
  //   setMainTicketList(newMainTicketList);
  //   setFormVisibleOnPage(false);
  // };

  const handleChangingSelectedTicket = (id) => {
    // const selectedTicket = this.state.mainTicketList.filter(
    //   (ticket) => ticket.id === id
    // )[0];
    // this.setState({ selectedTicket: selectedTicket });
    const selection = mainTicketList.filter((ticket) => ticket.id === id)[0];
    setSelectedTicket(selection);
  };

  let currentlyVisibleState = null;
  let buttonText = null;
  if (error) {
    currentlyVisibleState = <p>There was an error: {error}</p>;
  } else if (editing) {
    currentlyVisibleState = (
      <EditTicketForm
        ticket={selectedTicket}
        onEditTicket={handleEditingTicketInList}
      />
    );
    buttonText = "Return to Ticket List";
  } else if (selectedTicket != null) {
    currentlyVisibleState = (
      <TicketDetail
        ticket={selectedTicket}
        onClickingDelete={handleDeletingTicket}
        onClickingEdit={handleEditClick}
      />
    );
    buttonText = "Return to Ticket List";
  } else if (formVisibleOnPage) {
    currentlyVisibleState = (
      <NewTicketForm onNewTicketCreation={handleAddingNewTicketToList} />
    );
    buttonText = "Return to Ticket List";
  } else {
    currentlyVisibleState = (
      <TicketList
        onTicketSelection={handleChangingSelectedTicket}
        ticketList={mainTicketList}
      />
    );
    buttonText = "Add Ticket";
  }
  return (
    <React.Fragment>
      {currentlyVisibleState}
      {error ? null : <button onClick={handleClick}>{buttonText}</button>}
    </React.Fragment>
  );
}

export default TicketControl;
