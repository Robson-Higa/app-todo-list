import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect } from 'react';
import { AntDesign } from '@expo/vector-icons';


///////////////////////////////////////////////////////////////////////////////////////////
// Função utilizada para criar o BD ao iniciar a aplicação.
// Caso BD já exista, não será criado novamente, portanto os dados permanecerão
const iniciarBancoDeDados = async (db) => {
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      -- DROP TABLE tarefa;
      CREATE TABLE IF NOT EXISTS tarefa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        descricao TEXT
      );
    `)
    console.log('Banco de Dados inicializado')
  } catch (error) {
    console.log('Erro ao iniciar o Banco de Dados.');
  }
  
}


///////////////////////////////////////////////////////////////////////////////////////////
// Componente Usuario
// Este componente é utilizado para renderizar os dados do FlatList/BD
const TarefaBotao = ({tarefa, excluirTarefa, atualizarTarefa}) => {

  const [tarefaSelecionada, setTarefaSelecionada] = useState(null);
  const [estaEditando, setEstaEditando] = useState(false);
  const [tarefaEditada, setTarefaEditada] = useState({
    tarefa: tarefa.nome,
    descricao: tarefa.descricao,
  });


  // função para confirmar a exclusão de um usuário
  const confirmarExcluir = () => {
    Alert.alert(
      "Atenção!",
      'Deseja excluir a tarefa da lista?',
      [
        { text: 'Não', onPress: () => { }, style: 'cancel' },
        { text: 'Sim', onPress: () => excluirTarefa(tarefa.id) },
      ],
      { cancelable: true }
    );
  }


  // função para confirmar edição
  const handleEditar = () => {
    atualizarTarefa(tarefa.id, tarefaEditada.nome, tarefaEditada.descricao);
    setEstaEditando(false);
  }


  return (
    <View>
      <Pressable 
        style={styles.tarefaBotao}
        onPress={() => setTarefaSelecionada(tarefaSelecionada === tarefa.id ? null : tarefa.id)}
      >
        <Text style={styles.tarefaTexto}>{tarefa.id} - {tarefa.nome}</Text>
        {tarefaSelecionada === tarefa.id && (
          <View style={styles.actions}>
            <AntDesign 
              tarefa='edit'
              size={18}
              color='red'
              onPress={() => setEstaEditando(true)}
              style={styles.icon}
            />
            <AntDesign 
              name='delete'
              size={18}
              color='red'
              onPress={confirmarExcluir}
              style={styles.icon}
            />

             <AntDesign 
              name='delete'
              size={18}
              color='red'
              onPress={handleEditar}
              style={styles.icon}
            />
          </View>
        )}
      </Pressable>

      {tarefaSelecionada === tarefa.id && !estaEditando && (

      <View style={styles.tarefaConteudo}>
        <Text>Nome: {tarefa.nome}</Text>
        <Text>Descricao: {tarefa.descricao}</Text>
      </View>
      )}

      {tarefaSelecionada === tarefa.id && estaEditando && (
        <TarefaFormulario tarefa={tarefaSelecionada} setTarefa={setTarefaEditada} onSave={handleEditar} setMostrarFormulario={setEstaEditando} />
      )}
    </View>
  )
};


///////////////////////////////////////////////////////////////////////////////////////////
// Componente Usuario Formulário
// Este componente é utilizado para mostrar o formulário que será utilizado para
// criar ou atualizar um registro no BD
const TarefaFormulario = ({ tarefa, setTarefa, onSave, setMostrarFormulario }) => {
  return (
    <View>
      <TextInput 
        style={styles.input}
        placeholder='Nome'
        value={tarefa.nome}
        autoCapitalize='words'
        onChangeText={(text) => setTarefa({...tarefa, nome: text})}
      />
      <TextInput 
        style={styles.input}
        placeholder='Descrição'
        value={tarefa.descricao}
        onChangeText={(text) => setTarefa({...tarefa, descricao: text})}
        autoCapitalize='none'
      />
     
 
      <Pressable
        onPress={onSave}
        style={styles.saveButton}
      >
        <Text style={styles.buttonText}>Salvar</Text>
      </Pressable>

      <Pressable
        onPress={() => {setMostrarFormulario(false)}}
        style={styles.cancelButton}
      >
        <Text style={styles.buttonText}>Cancelar</Text>
      </Pressable>
    </View>
  );
}


///////////////////////////////////////////////////////////////////////////////////////////
// Função principal do aplicativo
// Primeira função executada ao abrir o aplicativo
export default App = () => {
  return (
    <SQLiteProvider databaseName='bancoToDo.db' onInit={iniciarBancoDeDados}>
      <View style={styles.container}>
        <Text style={styles.title}>ToDo List</Text>
        <Conteudo />
      </View>
    </SQLiteProvider>
  );
}


///////////////////////////////////////////////////////////////////////////////////////////
// Componente para mostrar todo o conteúdo do BD
// Este componente contém toda a parte de manipulação (CRUD) com o BD
const Conteudo = () => {
  const db = useSQLiteContext();
  const [tarefas, setTarefas] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tarefa, setTarefa] = useState({ id: 0, nome: '', descricao: ''});

  // função para obter todos os funcion
  const getTarefas = async () => {
    try {
      const allRows = await db.getAllAsync('SELECT * FROM tarefa');
      setTarefas(allRows);
    } catch (error) {
      console.log('Erro ao ler os dados: ', error)
    }
  };

  // CREATE / INSERT
  const confirmarSalvar = () => {
    if (tarefa.nome.length === 0 || tarefa.descricao.length === 0) {
      Alert.alert('Atenção!', 'Por favor, entre com todos os dados!')
    } else {
      Alert.alert('Atenção!', 'Tarefa adicionada com sucesso!')
      adicionarTarefa(tarefa);
      setTarefa({nome: '', descricao: ''});
      setMostrarFormulario(false);
    }
  }

  // função para adicionar um usuário
  const adicionarTarefa = async (novaTarefa) => {
    try {
      const query = await db.prepareAsync('INSERT INTO tarefa (nome, descricao) VALUES (?, ?)')
      await query.executeAsync([novaTarefa.nome, novaTarefa.descricao]);
      await getTarefas();
    } catch (error) {
      console.log('Erro ao adicionar tarefa', error)
    }

  }

  // UPDATE
  // função para atualizar um usuário
  const atualizarTarefa = async (tarefaId, novaTarefaNome, novaTarefaDescricao) => {
    try {
      a = await db.runAsync('UPDATE tarefa SET nome = ?, descricao= ? WHERE id = ?', [novaTarefaNome, novaTarefaDescricao, tarefaId]);
      Alert.alert('Atenção!', 'Nova tarefa salva com sucesso!')
      await getTarefas();
    } catch (error) {
      console.log('Erro ao atualizar.', error);
    }
  };


  // DELETE
  // função para confirmar exclusão de todos os usuários
  const confirmarExcluirTodos = () => {
    Alert.alert(
      'Atenção', 
      'Deseja excluir todos as tarefas', 
      [
        { text: 'Não', onPress: () => { }, style: 'cancel' },
        { text: 'Sim', onPress: excluirTodasTarefas },
      ],
      { cancelable: true }
    );
  }

   const confirmarExcluirTarefa = () => {
    Alert.alert(
      'Atenção', 
      'Deseja excluir todos as tarefas', 
      [
        { text: 'Não', onPress: () => { }, style: 'cancel' },
        { text: 'Sim', onPress: excluirTarefa },
      ],
      { cancelable: true }
    );
  }
  
  // função para excluir todos os usuários
  const excluirTodasTarefas = async () => {
    try {
      await db.runAsync('DELETE FROM tarefa');
      await getTarefas();
    } catch (error) {
      console.log('Erro ao excluir: ', error);
    }
  };

  // função para excluir um usuário
  const excluirTarefa = async (nome) => {
    try {
      await db.runAsync('DELETE FROM tarefa WHERE nome= ?', ['limpeza']);
      await getTarefas();
    } catch (error) {
      console.log('Erro ao excluir: ', error);
    }
  }

  // obter todos os usuários ao abrir o aplicativo
  useEffect(() => {
    // adicionarUsuario({nome: 'Vinicius', email: 'vinicius@email.com', telefone: '1111111'});
    // excluirTodosUsuarios();
    getTarefas();
  }, []);


  return (
    <View style={styles.contentContainer}>
      {tarefas.length === 0 ? (
        <Text>Não existem tarefas</Text>
      ) : (
        <FlatList 
          data={tarefas}
          renderItem={({item}) => (<TarefaBotao tarefa={item} excluirTarefa={excluirTarefa} atualizarTarefa={atualizarTarefa} />)}
          keyExtractor={(item) => item.id.toString()}
        />
      )}

      {mostrarFormulario && (<TarefaFormulario tarefa={tarefa} setTarefa={setTarefa} onSave={confirmarSalvar} setMostrarFormulario={setMostrarFormulario} />)}

      <View style={styles.iconsContent}>
        <AntDesign 
            name='pluscircleo'
            size={24}
            color='blue'
            onPress={() => setMostrarFormulario(true)}
            style={styles.icon}
          />
          
          <AntDesign 
            name='delete'
            size={24}
            color='red'
            onPress={confirmarExcluirTodos}
            style={styles.icon}
          />

           <AntDesign 
            name='delete'
            size={24}
            color='red'
            onPress={excluirTarefa}
            style={styles.icon}
          />
      </View>

    </View>
  );
}


// Todos os estilos de formação estão logo abaixo
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginVertical: 60,
    marginBottom: 20,
  },

  contentContainer: {
    flex: 1,
    width: '90%',
  },
  usuarioBotao: {
    backgroundColor: 'lightblue',
    padding: 6,
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center'
  },
  usuarioTexto: {
    fontSize: 20, 
    fontWeight: '700',
  },
  usuarioConteudo: {
    backgroundColor: '#cdcdcd',
    padding: 10,
  }, 
  icon: {
    marginHorizontal: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginVertical: 4,
  },
  saveButton: {
    backgroundColor: 'blue',
    padding: 10,
    marginVertical: 4,
  },
  buttonText: {
    color:'white',
    textAlign:'center',
  },
  cancelButton: {
    backgroundColor:'grey',
    padding: 10,
    marginVertical: 5,
  },
  iconsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  actions: {
    flexDirection:'row',
    justifyContent: 'space-around',
    padding:10,
  },
});
